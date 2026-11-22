// API-contract simulation: no game binary required.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','main.js'),'utf8');
function fixture(){
 const structures=new Map(),elements=new Map(),instances=[],placed=new Map();
 const callbacks=new Map(),senders=new Map(),targets=new Map(),nodes=new Map();
 const mut=[],recipes=new Map();
 const coord=(x,y)=>x+':'+y;
 const api={
  structures:{
   register:d=>structures.set(d.id,d),
   registerPlacementConfig:()=>{},
   updateData:(s,p)=>Object.assign(s.data,p),
   recipes:{register:(id,recipe)=>recipes.set(id,recipe)},
   forEachOfType:(name,cb)=>instances.filter(s=>s.type===name).forEach(cb),
   isTypeAtCell:(x,y,name)=>placed.get(coord(x,y))?.type===name,
   getAtCell:(x,y)=>placed.get(coord(x,y))||null
  },
  elements:{
   register:d=>elements.set(d.id,d),
   isTypeAtCell:(x,y,id)=>mut.find(e=>e.x===x&&e.y===y)?.type===id,
   getResolvedTypeAtCell:(x,y)=>mut.find(e=>e.x===x&&e.y===y)?.type??null,
   getIdByType:t=>t,
   getMatterTypeAtCell:(x,y)=>{const t=mut.find(e=>e.x===x&&e.y===y)?.type;return ['oxygen','hydrogen'].includes(t)?3:['water','florinol','acid'].includes(t)?2:1;}
  },
  grid:{
   isCellEmptyAtCell:(x,y)=>!mut.some(e=>e.x===x&&e.y===y),
   getDimensions:()=>({widthCells:100,heightCells:100}),
   mutate:fn=>fn({elements:{
    removeAtCell:(x,y)=>{const ix=mut.findIndex(e=>e.x===x&&e.y===y);if(ix>=0)mut.splice(ix,1);},
    createAtCell:(x,y,type)=>mut.push({x,y,type})
   }})
  },
  triggers:{register:(id,d)=>callbacks.set(id,d.callback)},
  signals:{
   registerSenderType:(id,fn)=>senders.set(id,fn),
   setOutputAtCell:()=>{},
   targets:{register:(id,fn)=>targets.set(id,fn)}
  },
  tech:{registerDefinition:(id,d)=>nodes.set(id,d),
    registerNode:(id,d)=>nodes.set(id,d),conservatory:{appendUnlock:()=>{}}},
  events:{on:()=>{}},ui:{toast:()=>{}},time:{getElapsedMs:()=>Date.now()},
  energy:{getNetworkFreeCapacityAtCell:()=>3500}
 };
 const enums={MatterType:{Powder:1,Liquid:2,Gas:3},Tech:{SignalDevices:1,Refining8:2}};
 vm.runInNewContext(source,{sandkit:{api,enums},console});
 const place=(type,x,y,extra={})=>{
  const d=structures.get('iono-'+type);
  assert.ok(d,'missing structure: '+type);
  const s={type:'iono-'+type,x,y,data:{...d.defaultData,...extra}};
  instances.push(s);placed.set(coord(x,y),s);return s;
 };
 const put=(type,x,y)=>mut.push({type,x,y});
 const run=()=>callbacks.get('iono:industrial-cycle')();
 return {structures,elements,instances,place,put,run,mut,senders,targets,nodes,recipes};
}
test('registers native silicon smelter recipe, chips and tech',()=>{
 const f=fixture();
 assert.equal(f.elements.size,13);
 assert.ok(f.recipes.has('smelter'));
 assert.equal(f.recipes.get('smelter').input,'silicon');
 for(const name of ['crystal-puller','crystal-saw','resist-maker','mask-aligner','etch-bath','die-saw'])
  assert.ok(f.structures.has('iono-'+name));
 assert.ok(f.nodes.has('iono-automation')&&f.nodes.has('iono-tier8')&&f.nodes.has('iono-tier9'));
});
test('physical box consumes on left and emits on right without creating free material',()=>{
 const f=fixture();
 const s=f.place('box',10,10,{material:'silicon',capacity:2,release:0});
 f.put('silicon',9,10);
 f.run();assert.equal(s.data.stored,1);assert.equal(f.mut.length,0);
 s.data.release=1;f.run();
 assert.equal(s.data.stored,0);assert.equal(f.mut.length,1);
 assert.equal(f.mut[0].type,'silicon');assert.equal(f.mut[0].x,11);
});
test('crystal puller uses purified silicon and water, never raw silicon plus charcoal',()=>{
 const f=fixture(); const machine=f.place('crystal-puller',10,10);
 f.put('iono-purified-silicon',9,10);f.put('water',10,9);
 f.run();assert.equal(machine.data.processed,1);
 assert.equal(f.mut.length,1);assert.equal(f.mut[0].type,'iono-silicon-crystal');
});
test('saw returns a wafer and recyclable cutting dust; blocked waste port stops production',()=>{
 const f=fixture();const m=f.place('crystal-saw',10,10);
 f.put('iono-silicon-crystal',9,10);f.put('water',10,11);
 f.run();assert.equal(m.data.processed,0);
 f.mut.splice(f.mut.findIndex(x=>x.type==='water'),1);
 f.run();assert.equal(m.data.processed,1);
 assert.ok(f.mut.some(x=>x.type==='iono-wafer'));
 assert.ok(f.mut.some(x=>x.type==='iono-silicon-dust'));
});
test('etch bath creates patterned wafer and spent etchant byproduct',()=>{
 const f=fixture();f.place('etch-bath',10,10);
 f.put('iono-exposed-wafer',9,10);f.put('acid',10,9);
 f.run();assert.ok(f.mut.some(x=>x.type==='iono-patterned-wafer'));
 assert.ok(f.mut.some(x=>x.type==='iono-spent-etchant'));
});
test('numeric cable transmits local storage amount to decider with tick delay',()=>{
 const f=fixture();
 const box=f.place('box',8,10,{material:'silicon',stored:50,value:50,release:0});
 f.place('wire',9,10);
 f.place('decider',10,10,{signal:'silicon',operator:'>=',threshold:40,outputSignal:'enable',amount:1});
 f.place('wire',11,10);
 const adapter=f.place('adapter',12,10,{signal:'enable',operator:'>',threshold:0});
 f.run();f.run();f.run();
 assert.equal(adapter.data.active,true);
 assert.equal(box.data.stored,50);
});

test('oxygen goes to the accepted port and hydrogen to reject port without loss',()=>{
 const f=fixture();
 const sep=f.place('phase-filter',10,10,{material:'oxygen'});
 f.put('oxygen',9,10);
 f.run();
 assert.equal(f.mut.length,1);
 assert.equal(f.mut[0].type,'oxygen');
 assert.equal(f.mut[0].x,11);
 assert.equal(sep.data.passed,1);
 f.mut.length=0;
 f.put('hydrogen',9,10);
 f.run();
 assert.equal(f.mut.length,1);
 assert.equal(f.mut[0].type,'hydrogen');
 assert.equal(f.mut[0].x,10);
 assert.equal(f.mut[0].y,11);
 assert.equal(sep.data.rejected,1);
});
test('separator refuses to destroy solids or route into blocked outlets',()=>{
 const f=fixture();
 f.place('phase-filter',10,10,{material:'oxygen'});
 f.put('silicon',9,10);f.run();
 assert.equal(f.mut.length,1);
 f.mut.length=0;
 f.put('oxygen',9,10);f.put('water',11,10);
 f.run();
 assert.equal(f.mut.length,2);
 assert.equal(f.mut.find(x=>x.x===9).type,'oxygen');
});

test('local power headroom sensor publishes energy capacity to cable',()=>{
 const f=fixture();
 const power=f.place('power-headroom',8,10);
 f.place('wire',9,10);
 f.place('decider',10,10,{signal:'charge-headroom',operator:'>=',threshold:3000,outputSignal:'enable',amount:1});
 f.place('wire',11,10);
 const adapter=f.place('adapter',12,10,{signal:'enable',operator:'>',threshold:0});
 f.run();f.run();f.run();
 assert.equal(power.data.value,3500);
 assert.equal(adapter.data.active,true);
});

test('fluid filter routes oxygen to accepted output and leaves rejected hydrogen untouched',()=>{
 const f=fixture();
 const filter=f.place('fluid-filter',10,10,{material:'oxygen',mode:'allow',reject:'hold'});
 f.put('oxygen',9,10);f.run();
 assert.equal(f.mut.length,1);assert.equal(f.mut[0].type,'oxygen');
 assert.equal(f.mut[0].x,11);
 f.mut.length=0;f.put('hydrogen',9,10);f.run();
 assert.equal(f.mut.length,1);assert.equal(f.mut[0].x,9);
});
test('fluid filter can divert rejected gases downward',()=>{
 const f=fixture();f.place('fluid-filter',10,10,{material:'oxygen',mode:'allow',reject:'down'});
 f.put('hydrogen',9,10);f.run();
 assert.equal(f.mut[0].type,'hydrogen');assert.equal(f.mut[0].x,10);assert.equal(f.mut[0].y,11);
});
