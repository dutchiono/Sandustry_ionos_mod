const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','main.js'),'utf8');
function fixture(){
 const structures=new Map(),elements=new Map(),terrains=new Map(),instances=[],particles=new Map(),solid=new Map();
 const callbacks=new Map(),senders=new Map(),targets=new Map(),nodes=new Map(),recipes=new Map(),listeners=new Map();
 const coord=(x,y)=>x+':'+y,errors=[],pipes=new Map();
 const target=(x,y)=>instances.find(s=>s.x===x&&s.y===y);
 const cellType=(x,y)=>particles.get(coord(x,y));
 const setCell=(x,y,m)=>particles.set(coord(x,y),m);
 const api={
  pipes:{isAtCell:(x,y)=>pipes.has(coord(x,y)),
   isEnabledAtCell:(x,y)=>pipes.get(coord(x,y))===true,
   setEnabledAtCell:(x,y,enabled)=>{if(pipes.has(coord(x,y)))pipes.set(coord(x,y,!!enabled);}},
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
  events:{on:(event,fn)=>listeners.set(event,fn)},
  ui:{toast:()=>{}},
  time:{getElapsedMs:()=>Date.now()},
  energy:{getNetworkFreeCapacityAtCell:()=>3500}
 };
 const enums={MatterType:{Powder:1,Liquid:2,Gas:3},Tech:{SignalDevices:1,Refining8:2}};
 const context={sandkit:{api,enums},console:{error:(...parts)=>errors.push(parts.join(' '))}};
 vm.runInNewContext(source+'\n;globalThis.__testMeterSnapshot=meterSnapshot;',context);
 const place=(type,x,y,extra={})=>{
  const d=structures.get('iono-'+type);
  assert.ok(d,'missing structure: '+type);
  const s={type:'iono-'+type,x,y,data:{...d.defaultData,...extra}};
  instances.push(s);return s;
 };
 const run=(count=1)=>{for(let i=0;i<count;i++)callbacks.get('iono:industrial-cycle')();};
 return {structures,elements,terrains,instances,place,run,errors,put:setCell,
  get:(x,y)=>cellType(x,y),solid,particles,targets,nodes,recipes,
  snapshot:context.__testMeterSnapshot,emit:(event,data)=>listeners.get(event)?.(data),pipes};
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
test('physical extruder consumes 3 purified silicon pixels per 3-high section',()=>{
 const f=fixture(),ex=f.place('crystal-grower',10,10);
 for(let i=0;i<2;i++){f.put(9,10,'iono-purified-silicon');f.run();}
 assert.equal(f.solid.size,0);
 assert.equal(ex.data.feedBuffer,2);
 f.put(9,10,'iono-purified-silicon');f.run();
 assert.equal(f.solid.size,3);
 assert.equal(ex.data.feedBuffer,0);
 for(const y of [9,8,7])assert.equal(f.solid.get('11:'+y),'iono-silicon-ingot');
});
test('solid ingot moves through every position and cutter only cuts at its own face',()=>{
 const f=fixture(),ex=f.place('crystal-grower',10,10),c=f.place('crystal-cutter',17,10);
 for(let i=0;i<15;i++){f.put(9,10,'iono-purified-silicon');f.run();}
 assert.equal(c.data.cutCount,0);
 assert.equal(f.solid.size,15);
 assert.equal(f.solid.get('15:9'),'iono-silicon-ingot');
 f.put(9,10,'iono-purified-silicon');f.run();
 f.put(9,10,'iono-purified-silicon');f.run();
 f.put(9,10,'iono-purified-silicon');f.run();
 assert.equal(c.data.cutCount,1);
 assert.equal(c.data.wafers,0);
 assert.equal(f.solid.get('16:9'),undefined);
 f.run(2);
 assert.equal(c.data.wafers,1);
 assert.equal(f.solid.size,15);
 assert.equal(ex.data.crystalMass,15);
});
test('blocked extrusion stops advancement without consuming batch silicon',()=>{
 const f=fixture(),ex=f.place('crystal-grower',10,10);
 for(let i=0;i<2;i++){f.put(9,10,'iono-purified-silicon');f.run();}
 f.put(12,8,'water');
 f.put(9,10,'iono-purified-silicon');f.run();
 // First new section is at x11 and may grow despite the obstruction farther ahead.
 assert.equal(f.solid.size,3);
 for(let i=0;i<2;i++){f.put(9,10,'iono-purified-silicon');f.run();}
 f.put(9,10,'iono-purified-silicon');f.run();
 assert.equal(f.solid.size,3);
 assert.equal(f.get(9,10),'iono-purified-silicon');
 assert.equal(ex.data.feedBuffer,2);
});
test('full track without a cutter applies backpressure to input',()=>{
 const f=fixture(),ex=f.place('crystal-grower',10,10);
 for(let i=0;i<18;i++){f.put(9,10,'iono-purified-silicon');f.run();}
 assert.equal(f.solid.size,18);
 f.put(9,10,'iono-purified-silicon');f.run(2);
 assert.equal(f.get(9,10),'iono-purified-silicon');
 assert.equal(ex.data.crystalMass,18);
});
test('copper plating and nickel packaging make discrete circuit chips, not falling-sand pixels',()=>{
 const f=fixture();
 f.place('patterning-bench',12,10,{patterned:1,value:1});
 const copper=f.place('copper-plater',13,10);
 f.put(13,9,'liquidCopper');f.run();
 assert.equal(copper.data.circuitWafers,1);
 assert.equal(f.get(13,9),undefined);
 const assembler=f.place('chip-assembler',14,10);
 f.put(14,9,'liquidNickel');f.run();
 assert.equal(copper.data.circuitWafers,0);
 assert.equal(assembler.data.chips,1);
 const carrier=f.place('chip-carrier',15,10);
 f.run();assert.equal(assembler.data.chips,0);
 assert.equal(carrier.data.chips,1);
 assert.equal([...f.particles.values()].some(x=>x.includes('chip')),false);
});
test('gold contacts are optional: liquid gold yields gold-grade chip, not required for standard chip',()=>{
 const f=fixture();
 f.place('copper-plater',13,10,{circuitWafers:2,value:2});
 const assembler=f.place('chip-assembler',14,10);
 f.put(14,9,'liquidNickel');
 f.put(14,11,'liquidGold');
 f.run();
 assert.equal(assembler.data.goldChips,1);
 assert.equal(assembler.data.chips,0);
 assert.equal(f.get(14,9),undefined);
 assert.equal(f.get(14,11),undefined);
 f.put(14,9,'liquidNickel');f.run();
 assert.equal(assembler.data.chips,1);
 assert.equal(assembler.data.goldChips,1);
 const carrier=f.place('chip-carrier',15,10);
 f.run(2);
 assert.equal(carrier.data.chips,1);
 assert.equal(carrier.data.goldChips,1);
 const ctrl=f.place('chip-controller',16,10);
 f.run();
 assert.equal(ctrl.data.installed,true);
 assert.equal(ctrl.data.contactGrade,'nickel');
 assert.equal(carrier.data.chips,0);
 assert.equal(carrier.data.goldChips,1);
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

test('rolling metrics count real silicon inputs and actual ingot output, not moves',()=>{
 const f=fixture();
 f.place('crystal-grower',10,10);
 for(let i=0;i<3;i++){f.put(9,10,'iono-purified-silicon');f.run();}
 const data=f.snapshot(1);
 const consumed=data.find(x=>x.material==='iono-purified-silicon');
 const produced=data.find(x=>x.material==='iono-silicon-ingot');
 assert.equal(consumed.consumed,3);
 assert.equal(consumed.produced,0);
 assert.equal(produced.produced,3);
 assert.equal(produced.consumed,0);
 assert.equal(produced.producedPerMin,3);
});
test('collection statistics do not pretend gathered gold was industrial production',()=>{
 const f=fixture();
 f.emit('resource:collected',{resourceId:'gold',amount:15});
 const gold=f.snapshot(1).find(x=>x.material==='gold');
 assert.equal(gold.collected,15);
 assert.equal(gold.produced,0);
 assert.equal(gold.consumed,0);
});
test('storage movement is counted as transport, not manufacture',()=>{
 const f=fixture();
 f.place('box',10,10,{material:'silicon',capacity:10,release:0});
 f.put(9,10,'silicon');f.run();
 let silicon=f.snapshot(1).find(x=>x.material==='silicon');
 assert.equal(silicon.received,1);
 assert.equal(silicon.produced,0);
 assert.equal(silicon.consumed,0);
});

test('gas and liquid phase filters route the right phase without deleting anything else',()=>{
 const f=fixture();
 const gas=f.place('gas-filter',10,10,{material:'oxygen'});
 f.put(9,10,'water');f.run();
 assert.equal(f.get(9,10),'water');
 f.particles.delete('9:10');
 f.put(9,10,'oxygen');f.run();
 assert.equal(f.get(11,10),'oxygen');
 f.particles.delete('11:10');
 f.put(9,10,'hydrogen');f.run();
 assert.equal(f.get(10,11),'hydrogen');
 const liquid=f.place('liquid-filter',20,10,{material:'florinol'});
 f.put(19,10,'oxygen');f.run();
 assert.equal(f.get(19,10),'oxygen');
 f.particles.delete('19:10');
 f.put(19,10,'florinol');f.run();
 assert.equal(f.get(21,10),'florinol');
 f.particles.delete('21:10');
 f.put(19,10,'water');f.run();
 assert.equal(f.get(20,11),'water');
});
test('one-cell pump and separate gas and liquid vents reject wrong phases and blocked exits',()=>{
 const f=fixture();
 f.place('fluid-pump',10,10,{phase:'liquid'});
 f.put(9,10,'oxygen');f.run();
 assert.equal(f.get(9,10),'oxygen');
 f.particles.delete('9:10');
 f.put(9,10,'florinol');f.run();
 assert.equal(f.get(11,10),'florinol');
 f.place('gas-vent',20,10);
 f.put(19,10,'water');f.run();
 assert.equal(f.get(19,10),'water');
 f.particles.delete('19:10');
 f.put(19,10,'oxygen');f.run();
 assert.equal(f.get(20,9),'oxygen');
 f.place('liquid-outlet',30,10);
 f.put(29,10,'hydrogen');f.run();
 assert.equal(f.get(29,10),'hydrogen');
 f.particles.delete('29:10');
 f.put(29,10,'water');f.run();
 assert.equal(f.get(30,11),'water');
});
test('pipe gate enables and disables a real adjacent pipe from physical numerical cable',()=>{
 const f=fixture();
 const gate=f.place('pipe-gate',10,10,{control:'circuit',signal:'enable',threshold:1});
 f.pipes.set('11:10',true);
 f.run(2);
 assert.equal(gate.data.enabled,false);
 assert.equal(f.pipes.get('11:10'),false);
 f.place('tank',8,9,{stored:10,value:10,release:0,material:'florinol'});
 f.place('wire',9,9);
 f.place('decider',10,9,{signal:'florinol',operator:'>=',threshold:5,outputSignal:'enable',amount:1});
 // A cable ABOVE the gate picks up the combinator's output via right output.
 f.place('wire',11,9);
 // Move gate to x11 so input is x11,9, pipe becomes x12,10.
 gate.x=11;
 f.pipes.delete('11:10');
 f.pipes.set('12:10',false);
 f.run(5);
 assert.equal(gate.data.enabled,true);
 assert.equal(f.pipes.get('12:10'),true);
});
