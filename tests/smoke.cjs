const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','main.js'),'utf8');
function fixture(){
 const structures=new Map(),elements=new Map(),terrains=new Map(),instances=[],particles=new Map(),solid=new Map();
 const callbacks=new Map(),senders=new Map(),targets=new Map(),nodes=new Map(),recipes=new Map();
 const coord=(x,y)=>x+':'+y,errors=[];
 const target=(x,y)=>instances.find(s=>s.x===x&&s.y===y);
 const cellType=(x,y)=>particles.get(coord(x,y));
 const setCell=(x,y,m)=>particles.set(coord(x,y),m);
 const api={
  structures:{
   register:d=>structures.set(d.id,d),
   registerPlacementConfig:()=>{},
   updateData:(s,p)=>Object.assign(s.data,p),
   forEachOfType:(name,cb)=>instances.filter(s=>s.type===name).forEach(cb),
   isTypeAtCell:(x,y,name)=>target(x,y)?.type===name,
   getAtCell:target,
   recipes:{register:(id,def)=>recipes.set(id,def)}
  },
  terrains:{
   register:d=>terrains.set(d.id,d),
   isTypeAtCell:(x,y,id)=>solid.get(coord(x,y))===id
  },
  elements:{
   register:d=>elements.set(d.id,d),
   isTypeAtCell:(x,y,id)=>cellType(x,y)===id,
   getResolvedTypeAtCell:cellType,
   getIdByType:t=>t,
   getMatterTypeAtCell:(x,y)=>{
    const t=cellType(x,y);
    return ['oxygen','hydrogen'].includes(t)?3:['water','florinol','acid'].includes(t)?2:1;
   }
  },
  grid:{
   isCellEmptyAtCell:(x,y)=>!particles.has(coord(x,y))&&!solid.has(coord(x,y)),
   getDimensions:()=>({widthCells:100,heightCells:100}),
   mutate:fn=>fn({
    elements:{
     removeAtCell:(x,y)=>particles.delete(coord(x,y)),
     createAtCell:(x,y,type)=>setCell(x,y,type)
    },
    terrains:{
     createAtCell:(x,y,type)=>solid.set(coord(x,y),type),
     removeAtCell:(x,y)=>solid.delete(coord(x,y))
    }
   })
  },
  triggers:{register:(id,d)=>callbacks.set(id,d.callback)},
  signals:{
   registerSenderType:(id,fn)=>senders.set(id,fn),
   setOutputAtCell:()=>{},
   targets:{register:(id,fn)=>targets.set(id,fn)}
  },
  tech:{
   registerDefinition:(id,d)=>nodes.set(id,d),
   registerNode:(id,d)=>nodes.set(id,d),
   conservatory:{appendUnlock:()=>{}}
  },
  events:{on:()=>{}},
  ui:{toast:()=>{}},
  time:{getElapsedMs:()=>Date.now()},
  energy:{getNetworkFreeCapacityAtCell:()=>3500}
 };
 const enums={MatterType:{Powder:1,Liquid:2,Gas:3},Tech:{SignalDevices:1,Refining8:2}};
 vm.runInNewContext(source,{sandkit:{api,enums},console:{error:(...parts)=>errors.push(parts.join(' '))}});
 const place=(type,x,y,extra={})=>{
  const d=structures.get('iono-'+type);
  assert.ok(d,'missing structure: '+type);
  const s={type:'iono-'+type,x,y,data:{...d.defaultData,...extra}};
  instances.push(s);return s;
 };
 const run=(count=1)=>{for(let i=0;i<count;i++)callbacks.get('iono:industrial-cycle')();};
 return {structures,elements,terrains,instances,place,run,errors,put:setCell,
  get:(x,y)=>cellType(x,y),solid,particles,targets,nodes,recipes};
}
test('registers real ingot terrain, no chip pixels, and vanilla silicon input remains',()=>{
 const f=fixture();
 assert.ok(f.terrains.has('iono-silicon-ingot'));
 assert.equal(f.elements.size,1);
 assert.ok(f.recipes.has('smelter'));
 assert.equal(f.recipes.get('smelter').input,'silicon');
 assert.ok(f.structures.has('iono-crystal-cutter'));
 assert.ok(f.structures.has('iono-chip-carrier'));
 assert.equal(f.structures.has('iono-wafer-furnace'),false);
 assert.ok(f.nodes.has('iono-tier8')&&f.nodes.has('iono-tier9'));
 assert.equal(f.errors.length,0);
});
test('each ingot terrain cell consumes exactly one existing silicon pixel',()=>{
 const f=fixture(),g=f.place('crystal-grower',10,10,{maxMass:8});
 f.put(9,10,'iono-purified-silicon');f.run();
 assert.equal(f.get(9,10),undefined);
 assert.equal(f.solid.get('11:9'),'iono-silicon-ingot');
 assert.equal(g.data.crystalMass,1);
 f.run();assert.equal(g.data.crystalMass,1);
 f.put(9,10,'iono-purified-silicon');f.run();
 assert.equal(f.solid.get('12:9'),'iono-silicon-ingot');
 assert.equal(g.data.crystalMass,2);
});
test('external demolition is observed; cutter earns wafer only for three real terrain slices',()=>{
 const f=fixture(),g=f.place('crystal-grower',10,10,{maxMass:6});
 for(let i=0;i<6;i++){f.put(9,10,'iono-purified-silicon');f.run();}
 assert.equal(g.data.complete,true);assert.equal(f.solid.size,6);
 const cut=f.place('crystal-cutter',14,10);
 f.run();assert.equal(cut.data.wafers,0);assert.equal(f.solid.size,5);
 // Each horizontal 3-cell slice yields a held wafer.
 f.run(5);assert.equal(cut.data.wafers,2);assert.equal(f.solid.size,0);
 f.put(9,10,'iono-purified-silicon');f.run();assert.equal(g.data.crystalMass,1);
 f.solid.clear();f.run();assert.equal(g.data.crystalMass,0);
});
test('chip fabrication consumes held workpieces, not spawned chip particles',()=>{
 const f=fixture();
 const saw=f.place('crystal-cutter',10,10,{wafers:2});
 const prep=f.place('wafer-processor',11,10);
 f.put(11,9,'oxygen');f.put(11,11,'florinol');f.run();
 assert.equal(saw.data.wafers,1);assert.equal(prep.data.coated,1);
 const pattern=f.place('patterning-bench',12,10);
 f.put(12,9,'acid');f.run();
 assert.equal(prep.data.coated,0);assert.equal(pattern.data.patterned,1);
 const assemble=f.place('chip-assembler',13,10);
 f.put(13,9,'liquidNickel');f.run();
 assert.equal(pattern.data.patterned,0);assert.equal(assemble.data.chips,1);
 const carrier=f.place('chip-carrier',14,10);
 f.run();assert.equal(assemble.data.chips,0);assert.equal(carrier.data.chips,1);
 assert.equal([...f.particles.values()].some(x=>x.includes('chip')),false);
});
test('blocked ingot space never consumes silicon',()=>{
 const f=fixture();f.place('crystal-grower',10,10);
 f.put(9,10,'iono-purified-silicon');f.put(11,9,'water');f.run();
 assert.equal(f.get(9,10),'iono-purified-silicon');assert.equal(f.solid.size,0);
});
test('binary numerical control pipeline can read local physical storage',()=>{
 const f=fixture(),box=f.place('box',8,10,{material:'silicon',stored:50,value:50,release:0});
 f.place('wire',9,10);
 f.place('decider',10,10,{signal:'silicon',operator:'>=',threshold:40,outputSignal:'enable',amount:1});
 f.place('wire',11,10);
 const adapter=f.place('adapter',12,10,{signal:'enable',operator:'>',threshold:0});
 f.run(3);assert.equal(adapter.data.active,true);assert.equal(box.data.stored,50);
});
test('filter routes oxygen right, hydrogen down and never consumes blocked particles',()=>{
 const f=fixture();const sep=f.place('phase-filter',10,10,{material:'oxygen'});
 f.put(9,10,'oxygen');f.run();
 assert.equal(f.get(11,10),'oxygen');assert.equal(sep.data.passed,1);
 f.put(9,10,'hydrogen');f.run();
 assert.equal(f.get(10,11),'hydrogen');assert.equal(sep.data.rejected,1);
 f.put(9,10,'oxygen');f.run();assert.equal(f.get(9,10),'oxygen');
});

test('one held chip installs in controller once and unlocks hysteresis output',()=>{
 const f=fixture();
 const carrier=f.place('chip-carrier',8,10,{chips:1,value:1});
 const controller=f.place('chip-controller',9,10,{low:50,high:100,signal:'florinol'});
 f.place('wire',9,9); // sensor cable ABOVE controller
 f.place('wire',10,10); // output cable RIGHT
 f.place('tank',8,9,{material:'florinol',stored:20,value:20,release:0});
 f.run();assert.equal(carrier.data.chips,0);assert.equal(controller.data.installed,true);
 f.run(2);assert.equal(controller.data.active,true);
 assert.equal(carrier.data.chips,0);
});
