import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('simulations-v3.js');
const data={window:{}};
vm.runInNewContext(read('content.js'),data);
vm.runInNewContext(source,data);
const cases=data.window.SIMULATIONS;
assert.equal(cases.length,16);
assert.equal(cases.reduce((n,s)=>n+s.messages.length,0),160);
assert.equal(new Set(cases.map(s=>s.id)).size,16);
for(const scene of cases){
 assert.equal(scene.messages.length,10,scene.id);
 for(const beat of scene.messages){
  assert.ok(beat.partner.trim().length>0);
  assert.equal(beat.options.length,3);
  assert.deepEqual(Array.from(beat.options,p=>p[3]),[3,1,0]);
  for(const option of beat.options)assert.ok(option[0]&&option[1]&&option[2],scene.id);
 }
}
const html=read('index.html');
assert.ok(html.indexOf('content.js')<html.indexOf('simulations-v3.js'));
assert.ok(html.indexOf('simulations-v3.js')<html.indexOf('app.js'));
assert.ok(read('sw.js').includes('simulations-v3.js'));
const clicks={};let scrollTopCalls=0;
class Element {constructor(){this.innerHTML='';this.hidden=false;this.classList={add(){},remove(){},toggle(){}};this.listeners={};this.dataset={};this.children=[];this.style={};}
 addEventListener(name,cb){this.listeners[name]=cb;}appendChild(c){this.children.push(c);}
 getBoundingClientRect(){return {top:350};}blur(){}
}
const els=new Map(['#view','#bottom','#toast','#nav','#voiceSettings','#simThread','#simStage','#simMeter'].map(s=>[s,new Element()]));
const document={querySelector:(s)=>els.get(s)||null,querySelectorAll:()=>[],createElement:()=>new Element(),activeElement:null};
const window={SIMULATIONS:cases,COURSE:data.window.COURSE,PHRASES:data.window.PHRASES,LAB_NOTES:data.window.LAB_NOTES,scrollY:200,scrollTo(arg){if(arg?.top===0)scrollTopCalls++;},innerHeight:800};
const localStorage={getItem:()=>null,setItem(){}};
const ctx={window,document,localStorage,navigator:{},location:{protocol:'file:'},HTMLElement:Element,requestAnimationFrame:(fn)=>fn(),SpeechSynthesisUtterance:class{},setTimeout:()=>1,clearTimeout:()=>{},console,Date,Math,Number,Array,String,Set,Map};
vm.runInNewContext(read('app.js'),ctx);
function click(attrs){
 const el={dataset:attrs,hasAttribute:(key)=>Object.prototype.hasOwnProperty.call(attrs,key.replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase()))};
 const handler=els.get('#view').listeners.click;
 handler({target:{closest:()=>el}});
}
click({sim:'s01'});
assert.ok(els.get('#view').innerHTML.includes('食事を終えた帰り道'));
const old=scrollTopCalls;
click({simChoice:'2'});
assert.ok(els.get('#simStage').innerHTML.includes('言い直し'));
assert.equal(scrollTopCalls,old,'answer must not scroll to page start');
click({simChoice:'0'});
assert.ok(els.get('#simStage').innerHTML.includes('YOUR RESPONSE'));
assert.equal(scrollTopCalls,old,'repair must not scroll to start');
for(let i=1;i<10;i++)click({simChoice:'0'});
assert.ok(!els.get('#simStage').innerHTML.includes('<strong>100</strong>')); // first bad answer means below full marks
assert.ok(els.get('#simStage').innerHTML.includes('/ 100点'));
assert.ok(els.get('#simStage').innerHTML.includes('不適切な返答'));
click({simRetry:''});
for(let i=0;i<10;i++)click({simChoice:'0'});
assert.ok(els.get('#simStage').innerHTML.includes('<strong>100</strong>'),'ideal path should score 100');
console.log('QA passed: 16 stories, 160 beats, retry, repair, scoring, no top-scroll.');
