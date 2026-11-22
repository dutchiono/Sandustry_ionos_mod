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
const materials=["florinol","silicon","acid","liquidNickel","auralite","water","sand","quartz","charcoal","oxygen","hydrogen"];
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
// Selective fluid/gas filters. One physical particle enters LEFT and exits RIGHT.
// A matching particle passes; an unmatched particle stays put (no deletion).
// A configurable bypass can send rejected material DOWN instead.
structure("fluid-filter","Fluid / Gas Filter",
 "Filter selected liquids or gases. LEFT inlet, RIGHT accepted outlet, DOWN rejected outlet.",
 {material:"water",mode:"allow",reject:"hold",signal:"enable",controlled:false,enabled:true,processed:0,value:0},
 "logistics","collector");
config("fluid-filter",[
 choice("material","Filter material","water",materials.concat(["oxygen","hydrogen","sulfur-dioxide"])),
 choice("mode","Selection","allow",["allow","block"]),
 choice("reject","Rejected particles","hold",["hold","down"]),
 choice("signal","Control signal","enable",["enable","calculated","florinol","silicon"]),
 choice("controlled","Require circuit","false",["false","true"])
]);
function fluidFilter(s){
 const inlet=[s.x-1,s.y],out=[s.x+1,s.y],reject=[s.x,s.y+1];
 const desired=s.data?.material||"water",mode=s.data?.mode||"allow";
 if(s.data?.controlled==="true" && !s.data?.enabled)return;
 // A single material type per cell; test only known liquids/gases to avoid
 // inadvertently routing solids through a fluid-specific filter.
 const candidates=["water","florinol","acid","oxygen","hydrogen","sulfur-dioxide",
 "iono-spent-etchant","iono-process-medium"];
 const actual=candidates.find(m=>isPixel(...inlet,m));
 if(!actual)return;
 const pass=mode==="allow"?actual===desired:actual!==desired;
 const destination=pass?out:(s.data?.reject==="down"?reject:null);
 if(!destination || !empty(...destination))return;
 api.grid.mutate(w=>{
  if(!isPixel(...inlet,actual)||!empty(...destination))return;
  w.elements.removeAtCell(...inlet);w.elements.createAtCell(...destination,actual);
 });
 update(s,{processed:read(s,"processed")+1,value:pass?1:0});
}
api.signals.targets.register(id("fluid-filter"),(s,p)=>update(s,{enabled:!!p.combined}));
// Multi-cell fixture workpieces: the crystal is one large non-falling solid object,
// represented by persistent machine data, NOT by a powder pixel.
function fixture(name,label,description,shape,defaults,order){
 api.structures.register({
  id:id(name),name:label,description,categoryKey:"industrial",order,
  shape,buildModes:[{type:"single"}],copyData:true,defaultData:defaults,
  render:{imageName:"collector",size:{width:shape[0].length,height:shape.length}}
 });
}
fixture("crystal-grower","Silicon Crystal Growth Fixture",
 "Consume physical Silicon to grow ONE solid crystal. Crystal mass is stored on this fixture.",
 [[1,1,1],[1,1,1],[1,1,1]],{crystalMass:0,maxMass:64,complete:false,enabled:true,value:0},210);
fixture("crystal-cutter","Crystal Cutter",
 "Cut a completed single crystal from the growth fixture immediately LEFT into discrete wafers.",
 [[1]],{wafers:0,dust:0,cutCount:0,enabled:true,value:0},211);
fixture("wafer-processor","Wafer Preparation Bench",
 "Prepare held wafers using physical Oxygen and Florinol; output held coated wafers.",
 [[1]],{coated:0,oxidized:0,enabled:true,value:0},212);
fixture("patterning-bench","Exposure and Etching Bench",
 "Produce patterned wafers from coated wafers using actual Acid; records spent bath.",
 [[1]],{patterned:0,spentBath:0,enabled:true,value:0},213);
fixture("chip-assembler","Chip Assembly Bench",
 "Fabricate discrete chips from patterned wafers and conductive metal.",
 [[1]],{chips:0,enabled:true,value:0},214);
fixture("chip-carrier","Chip Carrier",
 "A physical inventory for finished devices: chips are not falling-sand pixels.",
 [[1,1],[1,1]],{chips:0,capacity:64,enabled:true,value:0},215);
const WORKPIECE_NAMES=["crystal-grower","crystal-cutter","wafer-processor",
 "patterning-bench","chip-assembler","chip-carrier"];
function neighboring(structure,name,dx,dy){
 const x=structure.x+dx,y=structure.y+dy;
 return api.structures.isTypeAtCell(x,y,id(name))?api.structures.getAtCell(x,y):null;
}
// For any completed crystal, source data represents ONE solid body,
// not 64 individual crystals. Cutting yields an integer count of wafer objects.
function growCrystal(s){
 if(s.data?.enabled===false||s.data?.complete)return;
 const mass=read(s,"crystalMass"),max=cap(s.data?.maxMass,8,512);
 if(mass>=max){update(s,{complete:true});return;}
 const inlet=[s.x-1,s.y];
 api.grid.mutate(w=>{
  if(!isPixel(...inlet,"silicon"))return;
  w.elements.removeAtCell(...inlet);
  const next=mass+1;update(s,{crystalMass:next,complete:next>=max,value:next});
 });
}
function cutCrystal(s){
 if(s.data?.enabled===false)return;
 const growth=neighboring(s,"crystal-grower",-1,0);
 if(!growth||!growth.data?.complete)return;
 const mass=read(growth,"crystalMass"),yieldWafers=Math.floor(mass/4);
 if(yieldWafers<1)return;
 update(growth,{crystalMass:0,complete:false,value:0});
 update(s,{wafers:read(s,"wafers")+yieldWafers,
   dust:read(s,"dust")+(mass-yieldWafers*4),
   cutCount:read(s,"cutCount")+1,value:read(s,"wafers")+yieldWafers});
}
function prepareWafers(s){
 if(s.data?.enabled===false)return;
 const saw=neighboring(s,"crystal-cutter",-1,0);
 if(!saw||read(saw,"wafers")<1)return;
 // Existing oxygen stream is essential, and Florinol powers resist coating.
 const oxygen=[s.x,s.y-1],florinol=[s.x,s.y+1];
 api.grid.mutate(w=>{
  if(read(saw,"wafers")<1||!isPixel(...oxygen,"oxygen")||!isPixel(...florinol,"florinol"))return;
  w.elements.removeAtCell(...oxygen);w.elements.removeAtCell(...florinol);
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
  update(bench,{coated:read(bench,"coated")-1,value:read(bench,"coated")-1});
  update(s,{patterned:read(s,"patterned")+1,spentBath:read(s,"spentBath")+1,
   value:read(s,"patterned")+1});
 });
}
function assembleChips(s){
 if(s.data?.enabled===false)return;
 const pattern=neighboring(s,"patterning-bench",-1,0);
 const metal=[s.x,s.y-1];
 if(!pattern||read(pattern,"patterned")<1)return;
 api.grid.mutate(w=>{
  if(read(pattern,"patterned")<1||!isPixel(...metal,"liquidNickel"))return;
  w.elements.removeAtCell(...metal);
  update(pattern,{patterned:read(pattern,"patterned")-1,value:read(pattern,"patterned")-1});
  update(s,{chips:read(s,"chips")+1,value:read(s,"chips")+1});
 });
}
function storeChips(s){
 const assembler=neighboring(s,"chip-assembler",-1,0);
 const count=read(s,"chips"),capacity=cap(s.data?.capacity,1,1024);
 if(!assembler||count>=capacity||read(assembler,"chips")<1)return;
 update(assembler,{chips:read(assembler,"chips")-1,value:read(assembler,"chips")-1});
 update(s,{chips:count+1,value:count+1});
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
   update(s,{stored:stored+1,value:stored+1});return;
  }
  if(stored>0 && read(s,"release",1)>0 && empty(...right)){
   w.elements.createAtCell(...right,m);
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
 for(const type of ["box","tank","probe","power-headroom"]){
  api.structures.forEachOfType(id(type),s=>{
   const signal=s.data?.material||"florinol",v=read(s,"value");
   for(const [dx,dy] of offsets)output(s.x+dx,s.y+dy,signal,v);
  });
 }
 for(const type of ["decider","arithmetic","memory","adapter","valve"]){
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
   }
  });
 }
 lastSignals=new Map();
 groups.forEach((g,n)=>g.forEach(k=>lastSignals.set(k,current[n])));
}
api.signals.registerSenderType(id("adapter"),s=>!!s.data?.active);
api.triggers.register("iono:industrial-cycle",{interval:30,sequentialRuns:1,extra:{},callback:()=>{
 for(const kind of ["box","tank"])api.structures.forEachOfType(id(kind),s=>guard(kind,()=>storage(s)));
 api.structures.forEachOfType(id("probe"),s=>guard("probe",()=>probe(s)));
 api.structures.forEachOfType(id("power-headroom"),s=>guard("power meter",()=>powerMeter(s)));
 api.structures.forEachOfType(id("valve"),s=>guard("valve",()=>valve(s)));
 api.structures.forEachOfType(id("fluid-filter"),s=>guard("fluid filter",()=>fluidFilter(s)));
 api.structures.forEachOfType(id("phase-filter"),s=>guard("phase filter",()=>filter(s)));
 api.structures.forEachOfType(id("crystal-grower"),s=>guard("grow crystal",()=>growCrystal(s)));
 api.structures.forEachOfType(id("crystal-cutter"),s=>guard("cut crystal",()=>cutCrystal(s)));
 api.structures.forEachOfType(id("wafer-processor"),s=>guard("prepare wafers",()=>prepareWafers(s)));
 api.structures.forEachOfType(id("patterning-bench"),s=>guard("pattern wafers",()=>patternWafers(s)));
 api.structures.forEachOfType(id("chip-assembler"),s=>guard("assemble chips",()=>assembleChips(s)));
 api.structures.forEachOfType(id("chip-carrier"),s=>guard("store chips",()=>storeChips(s)));
 guard("numeric wiring",circuits);
}});
// Research is split: practical automation comes earlier, semiconductor industry
// starts after late refining. New nodes own their own unlock definitions.
const ta=id("automation"),t8=id("tier8"),t9=id("tier9");
const controls=["box","tank","wire","decider","arithmetic","memory","phase-filter",
 "power-headroom","adapter","valve","probe"].map(id);
const production8=["crystal-grower","crystal-cutter"].map(id);
const production9=["wafer-processor","patterning-bench","chip-assembler","chip-carrier"].map(id);
guard("automation research",()=>api.tech.registerNode(ta,{
 name:"Industrial Automation",description:"Instrument actual storage, flow, gases and power.",
 branch:"logistics",cost:2400,currencyType:"gold",
 requires:enums.Tech.SignalDevices,unlocks:{structures:controls}
},{parentId:enums.Tech.SignalDevices}));
guard("tier 8 research",()=>api.tech.registerNode(t8,{
 name:"Tier 8: Instrumentation & Fabrication",
 description:"Grow a physical Silicon crystal and cut it into held wafer workpieces.",
 branch:"refining",cost:18000,currencyType:"gold",
 requires:[enums.Tech.Refining8,ta],unlocks:{structures:production8}
},{parentId:enums.Tech.Refining8}));
guard("tier 9 research",()=>api.tech.registerNode(t9,{
 name:"Tier 9: Autonomous Industry",
 description:"Process discrete wafers with oxygen, Florinol, Acid and metal to make chips.",
 branch:"refining",cost:48000,currencyType:"gold",
 requires:t8,unlocks:{structures:production9}
},{parentId:t8}));
api.events.on("game:ready",()=>guard("welcome",()=>api.ui.toast("Iono Expansion loaded: physical controls and wafer fabrication.")));
