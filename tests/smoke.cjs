// API-contract simulation: no game binary required.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','main.js'),'utf8');
function fixture(){
 const structures=new Map(),elements=new Map(),instances=[],placed=new Map();
 const callbacks=new Map(),senders=new Map(),targets=new Map(),nodes=new Map();
 const mut=[];
 const coord=(x,y)=>x+':'+y;
 const api={
  structures:{
   register:d=>structures.set(d.id,d),
   registerPlacementConfig:()=>{},
   updateData:(s,p)=>Object.assign(s.data,p),
   forEachOfType:(name,cb)=>instances.filter(s=>s.type===name).forEach(cb),
   isTypeAtCell:(x,y,name)=>placed.get(coord(x,y))?.type===name,
   getAtCell:(x,y)=>placed.get(coord(x,y))||null
  },
  elements:{
   register:d=>elements.set(d.id,d),
   isTypeAtCell:(x,y,id)=>mut.find(e=>e.x===x&&e.y===y)?.type===id
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
    registerNode:()=>{},conservatory:{appendUnlock:()=>{}}},
  events:{on:()=>{}},ui:{toast:()=>{}},time:{getElapsedMs:()=>Date.now()}
 };
 const enums={MatterType:{Powder:1,Liquid:2},Tech:{SignalDevices:1}};
 vm.runInNewContext(source,{sandkit:{api,enums},console});
 const place=(type,x,y,extra={})=>{
  const d=structures.get('iono-'+type);
  assert.ok(d,'missing structure: '+type);
  const s={type:'iono-'+type,x,y,data:{...d.defaultData,...extra}};
  instances.push(s);placed.set(coord(x,y),s);return s;
 };
 const put=(type,x,y)=>mut.push({type,x,y});
 const run=()=>callbacks.get('iono:industrial-cycle')();
 return {structures,elements,instances,place,put,run,mut,senders,targets,nodes};
}
test('registers 8 real products, 2 tiers and industrial processors',()=>{
 const f=fixture();
 assert.equal(f.elements.size,8);
 assert.ok(f.nodes.has('iono-tier8')&&f.nodes.has('iono-tier9'));
 for(const kind of ['wafer-furnace','etcher','module-assembler','etchant-bath','reclaimer','core-forge','supervisor-assembler'])
 assert.ok(f.structures.has('iono-'+kind));
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
test('multi-input wafer machine consumes two physical pixels and creates one wafer',()=>{
 const f=fixture();
 const s=f.place('wafer-furnace',10,10);
 f.put('silicon',9,10);f.put('charcoal',10,9);
 f.run();assert.equal(s.data.processed,1);
 assert.deepEqual([...f.mut.map(e=>e.type)],['iono-wafer']);
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

test('Tier 9 orbital terminal consumes three inputs to deliver a shipment',()=>{
 const f=fixture();
 const s=f.place('orbital-terminal',10,10);
 f.put('iono-supervisor',9,10);
 f.put('iono-wafer',10,9);
 f.put('iono-process-medium',10,11);
 f.run();
 assert.equal(s.data.processed,1);
 assert.equal(f.mut.length,1);
 assert.equal(f.mut[0].type,'iono-orbital-shipment');
});
