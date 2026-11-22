// Sandustry Iono Industrial Expansion: Sandkit API v1
const api=sandkit.api, enums=sandkit.enums, prefix="iono-";
const id=x=>prefix+x, offsets=[[-1,0],[1,0],[0,-1],[0,1]];
const K=(x,y)=>x+":"+y;
const num=(v,f=0)=>Number.isFinite(+v)?Math.trunc(+v):f;
const cap=(v,a,b)=>Math.max(a,Math.min(b,num(v)));
const compare=(a,op,b)=>({"<":a<b,"<=":a<=b,"=":a===b,"!=":a!==b,">":a>b,">=":a>=b,">=":a>=b})[op]??false;
const calc=(a,op,b)=>({"+":a+b,"-":a-b,"*":a*b,"/":b?Math.trunc(a/b):0,"%":b?a%b:0,"min":Math.min(a,b),"max":Math.max(a,b)})[op]??0;
const read=(s,k,d=0)=>num(s.data?.[k],d);
const update=(s,x)=>api.structures.updateData(s,x);
const isPixel=(x,y,m)=>api.elements.isTypeAtCell(x,y,m);
const empty=(x,y)=>api.grid.isCellEmptyAtCell(x,y);
function guard(label,fn){try{return fn();}catch(error){console.error("[Iono] "+label,error);return null;}}
// Production statistics: exact for transactions executed by THIS mod.
// Vanilla production has no supported global mutation event; collection is
// tracked separately and must never be mislabeled "production".
const METRIC_BUCKET_MS=5000, METRIC_BUCKET_LIMIT=720;
const flowMetrics=new Map();
function meter(id,channel,quantity=1){
 if(!Number.isFinite(quantity)||quantity<=0)return;
 const tick=Math.floor(Date.now()/METRIC_BUCKET_MS),name=String(id);
 let state=flowMetrics.get(name);
 if(!state){state={buckets:new Map(),totals:Object.create(null)};flowMetrics.set(name,state);}
 let bucket=state.buckets.get(tick);
 if(!bucket){bucket=Object.create(null);state.buckets.set(tick,bucket);}
 bucket[channel]=(bucket[channel]||0)+quantity;
 state.totals[channel]=(state.totals[channel]||0)+quantity;
 // Bounded to a single hour per tracked material.
 if(state.buckets.size>METRIC_BUCKET_LIMIT){
  const first=state.buckets.keys().next().value;state.buckets.delete(first);
 }
}
function meterSnapshot(windowMinutes=1){
 const window=([1,5,60].includes(windowMinutes)?windowMinutes:1);
 const tick=Math.floor(Date.now()/METRIC_BUCKET_MS);
 const bucketCount=window*60000/METRIC_BUCKET_MS;
 return [...flowMetrics.entries()].map(([material,state])=>{
  const sums=Object.create(null),history=[];
  for(let i=bucketCount-1;i>=0;i--){
   const b=state.buckets.get(tick-i)||{};
   const made=b.produced||0,used=b.consumed||0;
   for(const ch of ["produced","consumed","collected","received","dispatched"]){
    sums[ch]=(sums[ch]||0)+(b[ch]||0);
   }
   history.push(made-used);
  }
  return {material,produced:sums.produced,consumed:sums.consumed,
   collected:sums.collected,received:sums.received,dispatched:sums.dispatched,
   net:sums.produced-sums.consumed,
   producedPerMin:sums.produced/window,consumedPerMin:sums.consumed/window,
   totals:{...state.totals},history};
 }).filter(x=>x.produced||x.consumed||x.collected||x.received||x.dispatched)
 .sort((a,b)=>(b.produced+b.consumed+b.collected)-(a.produced+a.consumed+a.collected));
}
api.events.on("resource:collected",event=>{
 if(event?.resourceId&&Number.isFinite(+event.amount))
  meter(event.resourceId,"collected",Math.max(0,+event.amount));
});
const materials=["florinol","silicon","iono-purified-silicon","acid","liquidNickel","liquidCopper","liquidGold","gold","goldGranulate","auralite","water","sand","quartz","charcoal","oxygen","hydrogen"];
const opts=xs=>xs.map(value=>({label:value,value}));
const choice=(key,label,def,values)=>({type:"choice",id:key,label,default:def,options:opts(values)});
const integer=(key,label,def,min,max)=>({type:"integer",id:key,label,default:def,min,max});
// Finished workpieces are NOT elements: they remain attached to machine instances.
// Existing Sandustry pixels supply raw material, cooling and chemistry.
function structure(short,name,description,data={},categoryKey="logistics",imageName="collector"){
 api.structures.register({id:id(short),name,description,categoryKey,
 buildModes:[{type:"single"}],defaultData:data,copyData:true,
 render:{imageName,size:{width:1,height:1}}});
}
function config(short,fields){api.structures.registerPlacementConfig({structureId:id(short),fields});}
structure("box","Inventory Box","Actual material storage: inlet LEFT, outlet RIGHT. Attach a data cable.",
 {material:"silicon",stored:0,capacity:256,release:1,value:0});
structure("tank","Fluid Tank","Actual fluid storage: inlet LEFT, outlet RIGHT. Attach a data cable.",
 {material:"florinol",stored:0,capacity:512,release:1,value:0});
structure("wire","Data Cable","Physical numerical signal wire. Connect cable segments together.",{},"logistics","signalWire");
structure("decider","Decider Combinator","Reads LEFT cable, sends RIGHT cable; conditions on amounts.",
 {signal:"florinol",operator:"<",threshold:100,outputSignal:"enable",amount:1,value:0});
structure("arithmetic","Arithmetic Combinator","Reads LEFT cable, sends RIGHT cable; arithmetic.",
 {signal:"florinol",operator:"+",constant:0,outputSignal:"calculated",value:0});
structure("memory","Memory Combinator","Reads LEFT cable and retains a number; sends RIGHT.",
 {signal:"enable",mode:"latch",stored:0,value:0});
structure("adapter","Signal Link Adapter","Converts numeric LEFT cable into vanilla boolean Signal Link.",
 {signal:"enable",operator:">",threshold:0,active:false,value:0},"logistics","signalToggle");
structure("valve","Signal Valve","Uses LEFT cable enable signal to move materials LEFT to RIGHT.",
 {signal:"enable",material:"florinol",threshold:1,enabled:false,value:0},"logistics","door");
structure("phase-filter","Fluid / Gas Separator","Route chosen gas or liquid from LEFT to RIGHT; all other selected fluid/gas particles exit BELOW. Never destroys rejected material.",
 {material:"oxygen",mode:"allow",enabled:true,passed:0,rejected:0,value:0},"logistics","collector");
structure("power-headroom","Power Network Meter","Measures the free charge capacity of the physically adjoining power network, as numeric cable signal.",
 {value:0,stored:0,material:"charge-headroom"},"logistics","collector");
structure("probe","Area Probe","Count actual pixels in a bounded area; connect data cable.",
 {material:"florinol",radius:4,value:0});
for(const [name,mat,size] of [["box","silicon",256],["tank","florinol",512]])
 config(name,[choice("material","Material",mat,materials),integer("capacity","Capacity",size,1,4096),integer("release","Release (0 or 1)",1,0,1)]);
config("phase-filter",[
 choice("material","Selected fluid/gas","oxygen",["oxygen","hydrogen","water","florinol","acid","sulfurDioxide","iono-spent-etchant","iono-photoresist"]),
 choice("mode","Selected material route","allow",["allow","block"])]);
config("probe",[choice("material","Material","florinol",materials),integer("radius","Radius",4,1,12)]);
config("decider",[choice("signal","Input","florinol",materials.concat(["enable","calculated"])),
 choice("operator","Comparison","<",["<","<=","=",">",">=","!="]),
 integer("threshold","Threshold",100,-100000,100000),
 choice("outputSignal","Output signal","enable",["enable","calculated","florinol","silicon"]),
 integer("amount","Output amount",1,-1000,1000)]);
config("arithmetic",[choice("signal","Input","florinol",materials.concat(["enable","calculated"])),
 choice("operator","Arithmetic","+",["+","-","*","/","%","min","max"]),
 integer("constant","Operand",0,-100000,100000),
 choice("outputSignal","Output signal","calculated",["calculated","enable","florinol","silicon"])]);
config("memory",[choice("signal","Input","enable",["enable","calculated","florinol","silicon"]),
 choice("mode","Memory mode","latch",["latch","sum","max"])]);
config("adapter",[choice("signal","Input","enable",["enable","calculated","florinol","silicon"]),
 choice("operator","Comparison",">",[">",">=","<","<=","=","!="]),
 integer("threshold","Threshold",0,-100000,100000)]);
config("valve",[choice("material","Material","florinol",materials),
 choice("signal","Input","enable",["enable","calculated","florinol","silicon"]),
 integer("threshold","Threshold",1,0,100000)]);
// Physical two-way separator: LEFT feed, RIGHT accepted, BELOW rejected.
// A non-matching particle is identified using the public resolved-type read API.
// Only Liquid/Gas particles are routed, preserving solids in place.
function filter(s){
 const left=[s.x-1,s.y],right=[s.x+1,s.y],down=[s.x,s.y+1];
 api.grid.mutate(w=>{
  if(s.data?.enabled===false)return;
  const raw=api.elements.getResolvedTypeAtCell(...left);
  if(raw===null||raw===undefined)return;
  const matter=api.elements.getMatterTypeAtCell(...left);
  if(matter!==enums.MatterType.Liquid && matter!==enums.MatterType.Gas)return;
  const material=api.elements.getIdByType(raw);
  if(typeof material!=="string")return;
  const chosen=s.data?.material||"oxygen",allow=s.data?.mode!=="block";
  const accepted=(material===chosen)===allow,out=accepted?right:down;
  if(!empty(...out))return;
  w.elements.removeAtCell(...left);
  w.elements.createAtCell(...out,raw);
  const field=accepted?"passed":"rejected";
  update(s,{[field]:read(s,field)+1,value:read(s,field)+1});
 });
}
// Preserve vanilla Silicon manufacture: Quartz → Grinder → Silica,
// then Silica + Charcoal → Silicon in the existing Reaction Chamber.
// Purification is attached to the EXISTING heat-powered Smelter.
api.elements.register({
 id:id("purified-silicon"),name:"Purified Silicon",
 description:"Heat-purified silicon feedstock for growing one solid ingot.",
 matterType:enums.MatterType.Powder,density:5,
 isGrabbable:true,isTransportable:true,
 colors:{variants:[[175,185,198,255],[145,161,177,255]]}
});
guard("silicon smelter recipe",()=>api.structures.recipes.register("smelter",{
 input:"silicon",outputs:[{elementType:id("purified-silicon"),chance:1}]
}));
// Growing Silicon is WORLD TERRAIN, not a powder or a hidden counter.
// Each real Silicon particle fed to the fixture adds one contiguous, solid cell.
api.terrains.register({
 id:id("silicon-ingot"),name:"Single-crystal Silicon",description:"Growable, cuttable silicon ingot.",
 hp:90,metaColor:0x9db6c9,colorHSL:[205,24,70],noShadow:false
});
// The grower anchors an actual terrain column that rises above it.
// Chips and wafers remain discrete inventory, never sand particles.
function fixture(name,label,description,shape,defaults,order){
 api.structures.register({
  id:id(name),name:label,description,categoryKey:"industrial",order,
  shape,buildModes:[{type:"single"}],copyData:true,defaultData:defaults,
  render:{imageName:"collector",size:{width:shape[0].length,height:shape.length}}
 });
}
fixture("crystal-grower","Silicon Ingot Extruder",
 "Feeds Purified Silicon from LEFT into a THREE-high ingot that advances RIGHT. Cutter SEVEN cells RIGHT.",
 [[1]],{crystalMass:0,feedBuffer:0,complete:false,enabled:true,value:0},210);
fixture("crystal-cutter","Crystal Face Cutter",
 "Cut only a solid ingot reaching this tool's LEFT face. Each THREE-cell cross-section yields one held wafer.",
 [[1]],{wafers:0,cutProgress:0,cutCount:0,enabled:true,value:0},211);
fixture("wafer-processor","Wafer Preparation Bench",
 "Prepare held wafers using physical Oxygen and Florinol; output held coated wafers.",
 [[1]],{coated:0,oxidized:0,enabled:true,value:0},212);
fixture("patterning-bench","Exposure and Etching Bench",
 "Produce patterned wafers from coated wafers using actual Acid; records spent bath.",
 [[1]],{patterned:0,spentBath:0,enabled:true,value:0},213);
fixture("copper-plater","Copper Interconnect Plater",
 "Patterned wafer enters from LEFT; Liquid Copper enters ABOVE. Creates a held conductive circuit wafer.",
 [[1]],{circuitWafers:0,enabled:true,value:0},214);
fixture("chip-assembler","Nickel Chip Packager",
 "Copper circuit wafer from LEFT; Liquid Nickel ABOVE. Optional Liquid Gold BELOW creates gold-contact chips.",
 [[1]],{chips:0,goldChips:0,enabled:true,value:0},215);
fixture("chip-carrier","Chip Carrier",
 "A physical inventory for finished devices: chips are not falling-sand pixels.",
 [[1,1],[1,1]],{chips:0,goldChips:0,capacity:64,enabled:true,value:0},216);
fixture("chip-controller","Chip-Based Process Controller",
 "Load one CHIP from a physical carrier LEFT; read a sensor bus ABOVE and drive RIGHT output with hysteresis.",
 [[1]],{installed:false,contactGrade:"none",signal:"florinol",low:50,high:100,active:false,value:0,enabled:true},217);
config("chip-controller",[
 choice("signal","Measured signal","florinol",["florinol","silicon","charge-headroom","chips","oxygen","hydrogen"]),
 integer("low","Switch ON below",50,0,100000),
 integer("high","Switch OFF above",100,0,100000)
]);
function loadChip(s){
 if(s.data?.installed)return;
 const carrier=neighboring(s,"chip-carrier",-1,0);
 if(!carrier)return;
 // Prefer the ordinary nickel-packaged chip; preserve costly gold-contact
 // variants until needed. An empty standard slot may use a gold chip.
 const standard=read(carrier,"chips"),gold=read(carrier,"goldChips");
 if(standard+gold<1)return;
 const useGold=standard===0;
 update(carrier,useGold
  ?{goldChips:gold-1,value:standard+gold-1}
  :{chips:standard-1,value:standard+gold-1});
 meter(useGold?"iono-gold-chip":"iono-chip","consumed");
 update(s,{installed:true,contactGrade:useGold?"gold":"nickel"});
}
const WORKPIECE_NAMES=["crystal-grower","crystal-cutter","wafer-processor",
 "patterning-bench","copper-plater","chip-assembler","chip-carrier","chip-controller"];
function neighboring(structure,name,dx,dy){
 // Find the nearest *physically adjacent* workpiece fixture along this axis.
 // Multi-cell fixture anchors may be several cells from the adjoining tool.
 for(let distance=1;distance<=4;distance++){
  const x=structure.x+dx*distance,y=structure.y+dy*distance;
  if(api.structures.isTypeAtCell(x,y,id(name)))
   return api.structures.getAtCell(x,y);
  if(api.structures.getAtCell(x,y))return null; // another structure blocks transfer
 }
 return null;
}
// Real horizontal extrusion: a THREE-high ingot advances one physical cell RIGHT
// for each THREE Purified Silicon feed pixels. It is not transferred magically.
const INGOT=id("silicon-ingot");
const INGOT_HEIGHT=3, INGOT_MAX_COLUMNS=6, CUTTER_OFFSET=INGOT_MAX_COLUMNS+1;
function extrusionCell(extruder,col,row){return [extruder.x+col, extruder.y-1-row];}
function solidAt(x,y){return api.terrains.isTypeAtCell(x,y,INGOT);}
function getBar(extruder){
 let length=0,jammed=false,seenGap=false;
 for(let col=1;col<=INGOT_MAX_COLUMNS;col++){
  let present=0;
  for(let row=0;row<INGOT_HEIGHT;row++)
   if(solidAt(...extrusionCell(extruder,col,row)))present++;
  if(present===INGOT_HEIGHT){
   if(seenGap)jammed=true;
   else length++;
  }else if(present!==0){jammed=true;seenGap=true;}
  else seenGap=true;
 }
 return {length,jammed};
}
function growCrystal(s){
 if(s.data?.enabled===false)return;
 const bar=getBar(s),buffer=cap(s.data?.feedBuffer,0,INGOT_HEIGHT);
 if(bar.jammed)return; // missing, damaged, or obstructed ingot: fail closed
 const inlet=[s.x-1,s.y];
 // Do not swallow more silicon once full; the cutter must cut the leading face.
 if(bar.length===INGOT_MAX_COLUMNS)return;
 api.grid.mutate(w=>{
  if(!isPixel(...inlet,id("purified-silicon")))return;
  // If a complete cross-section has been fed, push the whole solid ingot
  // EXACTLY ONE CELL to the right, then form a new column at the nozzle.
  if(buffer+1===INGOT_HEIGHT){
   for(let row=0;row<INGOT_HEIGHT;row++){
    const dest=extrusionCell(s,bar.length+1,row);
    if(!empty(...dest) || api.structures.getAtCell(...dest))return;
   }
   // The entire motion occurs as a single mutation transaction. Moving from
   // front to back avoids overwriting any live body cells.
   for(let col=bar.length;col>=1;col--){
    for(let row=0;row<INGOT_HEIGHT;row++){
     const from=extrusionCell(s,col,row),to=extrusionCell(s,col+1,row);
     if(!solidAt(...from))return;
     w.terrains.removeAtCell(...from);
     w.terrains.createAtCell(...to,INGOT);
    }
   }
   for(let row=0;row<INGOT_HEIGHT;row++)
    w.terrains.createAtCell(...extrusionCell(s,1,row),INGOT);
  }
  // Material conservation: exactly three input pixels per extruded section.
  w.elements.removeAtCell(...inlet);
  meter("iono-purified-silicon","consumed");
  if(buffer+1===INGOT_HEIGHT)meter("iono-silicon-ingot","produced",INGOT_HEIGHT);
  update(s,{feedBuffer:(buffer+1)%INGOT_HEIGHT,
   crystalMass:(bar.length+(buffer+1===INGOT_HEIGHT?1:0))*INGOT_HEIGHT,
   complete:bar.length+1>=INGOT_MAX_COLUMNS&&buffer+1===INGOT_HEIGHT,
   value:(bar.length+(buffer+1===INGOT_HEIGHT?1:0))*INGOT_HEIGHT});
 });
}
function cutCrystal(s){
 if(s.data?.enabled===false)return;
 // The cutter must sit at the actual end of the extrusion track.
 const sourceX=s.x-CUTTER_OFFSET;
 if(!api.structures.isTypeAtCell(sourceX,s.y,id("crystal-grower")))return;
 const extruder=api.structures.getAtCell(sourceX,s.y);
 if(!extruder)return;
 const col=INGOT_MAX_COLUMNS;
 const progress=cap(s.data?.cutProgress,0,INGOT_HEIGHT-1);
 const face=extrusionCell(extruder,col,progress);
 // Cutter does not work on incomplete bars, remote data or invented geometry.
 if(!solidAt(...face))return;
 api.grid.mutate(w=>{
  if(!solidAt(...face))return;
  w.terrains.removeAtCell(...face);
  meter("iono-silicon-ingot","consumed");
  const end=progress+1===INGOT_HEIGHT;
  const wafers=read(s,"wafers")+(end?1:0);
  if(end)meter("iono-wafer","produced");
  update(s,{cutProgress:end?0:progress+1,wafers,
   cutCount:read(s,"cutCount")+1,value:wafers});
  if(end)update(extruder,{crystalMass:Math.max(0,read(extruder,"crystalMass")-INGOT_HEIGHT),complete:false,
   value:Math.max(0,read(extruder,"crystalMass")-INGOT_HEIGHT)});
 });
}
function prepareWafers(s){
 if(s.data?.enabled===false)return;
 const saw=neighboring(s,"crystal-cutter",-1,0);
 if(!saw||read(saw,"wafers")<1)return;
 // Existing oxygen stream is essential; Florinol is a fictional photoresist feedstock.
 const oxygen=[s.x,s.y-1],florinol=[s.x,s.y+1];
 api.grid.mutate(w=>{
  if(read(saw,"wafers")<1||!isPixel(...oxygen,"oxygen")||!isPixel(...florinol,"florinol"))return;
  w.elements.removeAtCell(...oxygen);w.elements.removeAtCell(...florinol);
  meter("oxygen","consumed");meter("florinol","consumed");
  meter("iono-wafer","consumed");meter("iono-coated-wafer","produced");
  update(saw,{wafers:read(saw,"wafers")-1,value:read(saw,"wafers")-1});
  update(s,{coated:read(s,"coated")+1,value:read(s,"coated")+1});
 });
}
function patternWafers(s){
 if(s.data?.enabled===false)return;
 const bench=neighboring(s,"wafer-processor",-1,0),acid=[s.x,s.y-1];
 if(!bench||read(bench,"coated")<1)return;
 api.grid.mutate(w=>{
  if(read(bench,"coated")<1||!isPixel(...acid,"acid"))return;
  w.elements.removeAtCell(...acid);
  meter("acid","consumed");meter("iono-coated-wafer","consumed");
  meter("iono-patterned-wafer","produced");meter("iono-spent-etchant","produced");
  update(bench,{coated:read(bench,"coated")-1,value:read(bench,"coated")-1});
  update(s,{patterned:read(s,"patterned")+1,spentBath:read(s,"spentBath")+1,
   value:read(s,"patterned")+1});
 });
}
function plateCopper(s){
 if(s.data?.enabled===false)return;
 const patterned=neighboring(s,"patterning-bench",-1,0);
 const copper=[s.x,s.y-1];
 if(!patterned||read(patterned,"patterned")<1)return;
 api.grid.mutate(w=>{
  if(read(patterned,"patterned")<1||!isPixel(...copper,"liquidCopper"))return;
  w.elements.removeAtCell(...copper);
  meter("liquidCopper","consumed");
  meter("iono-patterned-wafer","consumed");
  meter("iono-circuit-wafer","produced");
  update(patterned,{patterned:read(patterned,"patterned")-1,
    value:read(patterned,"patterned")-1});
  update(s,{circuitWafers:read(s,"circuitWafers")+1,value:read(s,"circuitWafers")+1});
 });
}
function assembleChips(s){
 if(s.data?.enabled===false)return;
 const copper=neighboring(s,"copper-plater",-1,0);
 const nickel=[s.x,s.y-1],gold=[s.x,s.y+1];
 if(!copper||read(copper,"circuitWafers")<1)return;
 api.grid.mutate(w=>{
  if(read(copper,"circuitWafers")<1||!isPixel(...nickel,"liquidNickel"))return;
  const premium=isPixel(...gold,"liquidGold");
  w.elements.removeAtCell(...nickel);
  if(premium)w.elements.removeAtCell(...gold);
  meter("liquidNickel","consumed");
  if(premium)meter("liquidGold","consumed");
  meter("iono-circuit-wafer","consumed");
  meter(premium?"iono-gold-chip":"iono-chip","produced");
  update(copper,{circuitWafers:read(copper,"circuitWafers")-1,
   value:read(copper,"circuitWafers")-1});
  if(premium)update(s,{goldChips:read(s,"goldChips")+1,
   value:read(s,"chips")+read(s,"goldChips")+1});
  else update(s,{chips:read(s,"chips")+1,
   value:read(s,"chips")+read(s,"goldChips")+1});
 });
}
function storeChips(s){
 const assembler=neighboring(s,"chip-assembler",-1,0);
 const count=read(s,"chips"),gold=read(s,"goldChips");
 const capacity=cap(s.data?.capacity,1,1024);
 if(!assembler||count+gold>=capacity)return;
 // Standard and gold-contact variants occupy separate physical carrier slots.
 const standard=read(assembler,"chips"),premium=read(assembler,"goldChips");
 if(standard+premium===0)return;
 if(standard>0){
  update(assembler,{chips:standard-1,value:standard+premium-1});
  update(s,{chips:count+1,value:count+gold+1});
 }else{
  update(assembler,{goldChips:premium-1,value:standard+premium-1});
  update(s,{goldChips:gold+1,value:count+gold+1});
 }
}
for(const name of WORKPIECE_NAMES){
 api.signals.targets.register(id(name),(s,p)=>update(s,{enabled:!!p.combined}));
}
function storage(s){
 const m=s.data?.material||"silicon",limit=cap(s.data?.capacity,1,4096);
 const left=[s.x-1,s.y],right=[s.x+1,s.y];
 // Carry the inventory update inside the idle mutation to prevent phantom additions
 // if another machine changes the inlet between scheduling and commit.
 api.grid.mutate(w=>{
  const stored=cap(s.data?.stored,0,limit);
  if(stored<limit && isPixel(...left,m)){
   w.elements.removeAtCell(...left);
   meter(m,"received");
   update(s,{stored:stored+1,value:stored+1});return;
  }
  if(stored>0 && read(s,"release",1)>0 && empty(...right)){
   w.elements.createAtCell(...right,m);
   meter(m,"dispatched");
   update(s,{stored:stored-1,value:stored-1});return;
  }
  if(read(s,"value")!==stored)update(s,{value:stored});
 });
}
function probe(s){
 const radius=cap(s.data?.radius,1,12),m=s.data?.material||"florinol";
 const {widthCells:w,heightCells:h}=api.grid.getDimensions();let count=0;
 for(let y=Math.max(0,s.y-radius);y<=Math.min(h-1,s.y+radius);y++)
  for(let x=Math.max(0,s.x-radius);x<=Math.min(w-1,s.x+radius);x++)
   if(isPixel(x,y,m))count++;
 if(read(s,"value")!==count)update(s,{value:count});
}
function reaction(s,a,b,out){
 if(s.data?.enabled===false)return;
 const left=[s.x-1,s.y],top=[s.x,s.y-1],right=[s.x+1,s.y];
 api.grid.mutate(w=>{
  if(s.data?.enabled===false || !isPixel(...left,a)||!isPixel(...top,b)||!empty(...right))return;
  w.elements.removeAtCell(...left);w.elements.removeAtCell(...top);
  w.elements.createAtCell(...right,out);
  update(s,{processed:read(s,"processed")+1,value:read(s,"processed")+1});
 });
}
function valve(s){
 const m=s.data?.material||"florinol",left=[s.x-1,s.y],right=[s.x+1,s.y];
 api.grid.mutate(w=>{
  if(s.data?.enabled && isPixel(...left,m) && empty(...right)){
   w.elements.removeAtCell(...left);w.elements.createAtCell(...right,m);
  }
 });
}
// Energy measurement is *local* to the structure's connected power network, never global.
function powerMeter(s){
 const free=api.energy.getNetworkFreeCapacityAtCell(s.x,s.y);
 const value=Number.isFinite(free)?cap(free,0,1000000):0;
 if(read(s,"value")!==value)update(s,{value});
}
// Physical cable networks; inputs and outputs are sampled on successive clock cycles.
let lastSignals=new Map();
function circuits(){
 const cells=new Map();
 api.structures.forEachOfType(id("wire"),s=>cells.set(K(s.x,s.y),s));
 const membership=new Map(),groups=[],visited=new Set();
 for(const [first] of cells){
  if(visited.has(first))continue;
  const queue=[first],group=[];visited.add(first);
  for(let i=0;i<queue.length && i<8192;i++){
   const k=queue[i],s=cells.get(k);group.push(k);membership.set(k,groups.length);
   for(const [dx,dy] of offsets){const next=K(s.x+dx,s.y+dy);
    if(cells.has(next)&&!visited.has(next)){visited.add(next);queue.push(next);}
   }
  }
  groups.push(group);
 }
 const current=groups.map(()=>Object.create(null));
 const old=groups.map(g=>lastSignals.get(g[0])||Object.create(null));
 const bus=(x,y)=>membership.get(K(x,y));
 const input=(x,y,signal)=>{const n=bus(x,y);return n===undefined?0:old[n][signal]||0;};
 const output=(x,y,signal,v)=>{const n=bus(x,y);if(n===undefined)return;
  current[n][signal]=cap((current[n][signal]||0)+v,-1000000,1000000);};
 for(const type of ["box","tank","probe","power-headroom","chip-carrier"]){
  api.structures.forEachOfType(id(type),s=>{
   const signal=type==="chip-carrier"?"chips":(s.data?.material||"florinol"),v=read(s,"value");
   for(const [dx,dy] of offsets)output(s.x+dx,s.y+dy,signal,v);
  });
 }
 for(const type of ["decider","arithmetic","memory","adapter","valve","chip-controller"]){
  api.structures.forEachOfType(id(type),s=>{
   const signal=s.data?.signal||"enable",v=input(s.x-1,s.y,signal);
   if(type==="decider"){
    const value=compare(v,s.data?.operator||"<",read(s,"threshold"))?read(s,"amount",1):0;
    output(s.x+1,s.y,s.data?.outputSignal||"enable",value);update(s,{value:v});
   }else if(type==="arithmetic"){
    const result=cap(calc(v,s.data?.operator||"+",read(s,"constant")),-1000000,1000000);
    output(s.x+1,s.y,s.data?.outputSignal||"calculated",result);update(s,{value:v});
   }else if(type==="memory"){
    let value=read(s,"stored");
    if(s.data?.mode==="sum")value=cap(value+v,-1000000,1000000);
    else if(s.data?.mode==="max")value=Math.max(value,v);
    else if(v!==0)value=v;
    output(s.x+1,s.y,signal,value);update(s,{stored:value,value:v});
   }else if(type==="adapter"){
    const active=compare(v,s.data?.operator||">",read(s,"threshold"));
    update(s,{active,value:v});api.signals.setOutputAtCell(s.x,s.y,active);
   }else if(type==="valve"){
    update(s,{enabled:v>=read(s,"threshold",1),value:v});
   }else if(type==="chip-controller"){
    const signal=s.data?.signal||"florinol";
    const n=input(s.x,s.y-1,signal),lo=read(s,"low",50),hi=Math.max(lo+1,read(s,"high",100));
    const active=s.data?.installed && s.data?.enabled!==false && (n<lo?true:n>hi?false:!!s.data?.active);
    output(s.x+1,s.y,"enable",active?1:0);
    if(s.data?.active!==active||read(s,"value")!==n)update(s,{active,value:n});
   }
  });
 }
 lastSignals=new Map();
 groups.forEach((g,n)=>g.forEach(k=>lastSignals.set(k,current[n])));
}
api.signals.registerSenderType(id("adapter"),s=>!!s.data?.active);
api.triggers.register("iono:industrial-cycle",{intervalMs:250,sequentialRunCount:1,callback:()=>{
 for(const kind of ["box","tank"])api.structures.forEachOfType(id(kind),s=>guard(kind,()=>storage(s)));
 api.structures.forEachOfType(id("probe"),s=>guard("probe",()=>probe(s)));
 api.structures.forEachOfType(id("power-headroom"),s=>guard("power meter",()=>powerMeter(s)));
 api.structures.forEachOfType(id("valve"),s=>guard("valve",()=>valve(s)));
 api.structures.forEachOfType(id("phase-filter"),s=>guard("phase filter",()=>filter(s)));
 api.structures.forEachOfType(id("crystal-grower"),s=>guard("grow crystal",()=>growCrystal(s)));
 api.structures.forEachOfType(id("crystal-cutter"),s=>guard("cut crystal",()=>cutCrystal(s)));
 api.structures.forEachOfType(id("wafer-processor"),s=>guard("prepare wafers",()=>prepareWafers(s)));
 api.structures.forEachOfType(id("patterning-bench"),s=>guard("pattern wafers",()=>patternWafers(s)));
 api.structures.forEachOfType(id("copper-plater"),s=>guard("copper deposition",()=>plateCopper(s)));
 api.structures.forEachOfType(id("chip-assembler"),s=>guard("assemble chips",()=>assembleChips(s)));
 api.structures.forEachOfType(id("chip-carrier"),s=>guard("store chips",()=>storeChips(s)));
 api.structures.forEachOfType(id("chip-controller"),s=>guard("load chip",()=>loadChip(s)));
 guard("numeric wiring",circuits);
}});
// Research is split: practical automation comes earlier, semiconductor industry
// starts after late refining. New nodes own their own unlock definitions.
const ta=id("automation"),t8=id("tier8"),t9=id("tier9");
const controls=["box","tank","wire","decider","arithmetic","memory","phase-filter",
 "power-headroom","adapter","valve","probe"].map(id);
const production8=["crystal-grower","crystal-cutter"].map(id);
const production9=["wafer-processor","patterning-bench","copper-plater","chip-assembler","chip-carrier","chip-controller"].map(id);
// Research registry: definitions, nodes, and unlocks are separate Sandkit calls.
// Tier 8 is attached to the actual Refining8 node; automation branches earlier.
guard("register research",()=>{
 const base=enums.Tech.SignalDevices,refinery=enums.Tech.Refining8;
 const defAuto={
  name:"Industrial Automation",
  description:"Physical storage, probes, liquid/gas sorting and numerical wired logic.",
  branch:"logistics",cost:2400,currencyType:"gold"
 };
 const def8={
  name:"Tier 8: Silicon Crystal Engineering",
  description:"Purify Silicon using your existing Smelter; grow and cut real silicon ingots.",
  branch:"refining",cost:18000,currencyType:"gold"
 };
 const def9={
  name:"Tier 9: Wafer and Chip Production",
  description:"Process wafers with oxygen, Florinol and Acid; assemble installable logic chips.",
  branch:"refining",cost:48000,currencyType:"gold"
 };
 for(const [tech,def,parent] of [[ta,defAuto,base],[t8,def8,refinery],[t9,def9,t8]]){
  api.tech.registerDefinition(tech,def);
  api.tech.registerNode(tech,def,{parentId:parent});
 }
 api.tech.conservatory.appendUnlock(ta,{structures:controls});
 api.tech.conservatory.appendUnlock(t8,{structures:production8});
 api.tech.conservatory.appendUnlock(t9,{structures:production9});
});
api.events.on("game:ready",()=>guard("welcome",()=>api.ui.toast("Iono Expansion loaded: physical controls and wafer fabrication.")));

// The statistics widget is intentionally read-only: its global rates do not
// feed the data cable network; circuit inputs still require a physical sensor.
if(sandkit.react && api.ui?.inject){
 const React=sandkit.react,h=React.createElement;
 const panelStyle={
  position:"fixed",right:"14px",top:"72px",zIndex:9999,
  width:"min(470px, 92vw)",maxHeight:"78vh",overflowY:"auto",
  background:"rgba(16,23,31,0.96)",color:"#eaf3f8",
  border:"1px solid #516574",borderRadius:"8px",padding:"12px",
  fontFamily:"system-ui, sans-serif",fontSize:"12px",
  boxShadow:"0 12px 45px rgba(0,0,0,.4)"
 };
 const btn={background:"#314b60",color:"#eff9ff",border:"1px solid #6b8599",
  borderRadius:"5px",padding:"5px 8px",cursor:"pointer"};
 function MetricSparkline({history}){
  const samples=[],stride=Math.max(1,Math.ceil(history.length/40));
  for(let j=0;j<history.length;j+=stride)
   samples.push(history.slice(j,j+stride).reduce((a,b)=>a+b,0));
  const hi=Math.max(1,...samples.map(x=>Math.abs(x)));
  const points=samples.map((v,i)=>(
   (i*(100/Math.max(1,samples.length-1))).toFixed(2)+","+
   (20-v/hi*15).toFixed(2))).join(" ");
  return h("svg",{width:100,height:40,viewBox:"0 0 100 40",
   style:{display:"block",flex:"0 0 100px"},role:"img",
   "aria-label":"net flow over time"},
   h("line",{x1:0,y1:20,x2:100,y2:20,stroke:"#647785",strokeWidth:0.6}),
   h("polyline",{points,stroke:"#58d1ac",strokeWidth:1.5,fill:"none"}));
 }
 function StatisticsPanel(){
  const [visible,setVisible]=React.useState(false);
  const [minutes,setMinutes]=React.useState(5);
  const [search,setSearch]=React.useState("");
  const [,refresh]=React.useState(0);
  React.useEffect(()=>{
   // Refresh once per bucket, not on every frame.
   const task=setInterval(()=>refresh(v=>v+1),5000);
   return ()=>clearInterval(task);
  },[]);
  if(!visible)return h("button",{style:{...btn,position:"fixed",right:12,top:72,zIndex:9999},
    onClick:()=>setVisible(true)},"Factory statistics");
  const rows=meterSnapshot(minutes).filter(row=>
   row.material.toLowerCase().includes(search.toLowerCase()));
  return h("section",{style:panelStyle,"aria-label":"Iono factory statistics"},
   h("header",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}},
    h("strong",{style:{fontSize:15}},"Production / consumption"),
    h("button",{style:btn,onClick:()=>setVisible(false)},"Close")),
   h("div",{style:{display:"flex",gap:5,marginBottom:8}},
    ...[1,5,60].map(m=>h("button",{key:m,
     style:{...btn,background:minutes===m?"#1d796e":"#314b60"},
     onClick:()=>setMinutes(m)},m===60?"1 hour":m+" min")),
    h("input",{placeholder:"Filter material...",value:search,
     onChange:e=>setSearch(e.target.value),style:{minWidth:0,flex:1,
     color:"#edf7fa",background:"#233440",border:"1px solid #516574",borderRadius:4,padding:5}})),
   h("p",{style:{color:"#a7bdc9",fontSize:11,margin:"0 0 9px"}},
    "Exact: mod processing and storage movements. Collected: collection events. "+
    "Vanilla factories aren't globally instrumented; zero does not imply inactivity."),
   h("div",{style:{display:"grid",gridTemplateColumns:"minmax(90px,1fr) repeat(3,65px) 104px",
     gap:5,color:"#9db9c5",fontSize:10,borderBottom:"1px solid #435563",paddingBottom:5}},
    ...["Material","Prod /min","Use /min","Net /min","Trend"].map(t=>h("span",{key:t},t))),
   rows.length?rows.map(row=>h("div",{key:row.material,style:{
    display:"grid",gridTemplateColumns:"minmax(90px,1fr) repeat(3,65px) 104px",gap:5,
    borderBottom:"1px solid #30434f",alignItems:"center",padding:"4px 0"}},
    h("span",{title:row.material,style:{overflow:"hidden",textOverflow:"ellipsis"}},row.material.replace(/^iono-/,"")),
    h("span",null,row.producedPerMin.toFixed(1)),
    h("span",null,row.consumedPerMin.toFixed(1)),
    h("span",{style:{color:row.net<0?"#e4ae7e":"#84d6a9"}},(row.net/minutes).toFixed(1)),
    h(MetricSparkline,{history:row.history}),
    (row.collected||row.received||row.dispatched)?
     h("small",{style:{gridColumn:"1 / -1",color:"#93aebe"}},
      "Collected "+row.collected+" · Stored in "+row.received+" · Released "+row.dispatched):null
   )):h("p",{style:{color:"#9db9c5"}},"No recorded flow in this window."),
   h("p",{style:{color:"#94aab7",fontSize:10,marginTop:9}},
    "Rolling 1m / 5m / 60m. Counts are process transactions, not inventory totals."));
 }
 guard("statistics UI",()=>api.ui.inject("ionoFactoryStatistics",StatisticsPanel));
}
