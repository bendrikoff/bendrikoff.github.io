(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MarsCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ROW=3,HOP_TIME=.48;
 const missions=[
  ['Elysium','First paw on Mars','Choose each leap. Cross an edge to wrap around.',24,'EASY','#c7543e','#ffbe79'],
  ['Phobos','A moon of your own','Look ahead before leaping across the lunar gaps.',28,'EASY','#817993','#c7c1d9'],
  ['Deimos','Into the blue','Plan your path between the frozen crystals.',32,'MEDIUM','#3f898e','#a8e4d7'],
  ['Valles','Canyon calling','Two directions. One more step toward home.',36,'MEDIUM','#ae6342','#ecc08b'],
  ['Olympus','The long way up','Read the next rows and use the edges wisely.',40,'HARD','#83516b','#dba0a2'],
  ['Mars','Welcome home, Dogelon','Bring the coins home, one careful leap at a time.',44,'HARD','#d65a38','#ffc37a']
 ].map(([name,title,description,rows,difficulty,color,light])=>({name,title,description,rows,length:rows*ROW,speed:ROW/HOP_TIME,difficulty,color,light}));
 function random(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 function wrap(lane){return ((lane+1)%3+3)%3-1;}
 function course(index,seed=0){const rng=random(837+index*931+seed),events=[];let reachable=[0],coinPath=0;
  for(let row=1;row<=missions[index].rows;row++){
   // Every safe landing in the previous row has a safe diagonal successor.
   coinPath=wrap(coinPath+(rng()<.5?-1:1));const safe=new Set([coinPath]);for(const lane of reachable)if(!safe.has(wrap(lane-1))&&!safe.has(wrap(lane+1)))safe.add(wrap(lane+(rng()<.5?-1:1)));
   if(row===1||rng()<.3)safe.add(Math.floor(rng()*3)-1);
   const hazards=[];for(let lane=-1;lane<=1;lane++)if(!safe.has(lane)){const r=rng();hazards.push({lane,type:r<.4?'gap':r<.75?'spikes':'rock'});}
   const choices=[...safe],coinLane=(row-2)%4===0?coinPath:null;
   events.push({row,z:row*ROW,hazards,pathLane:coinPath,coinLane,collected:false,checked:false});reachable=choices;
  }return events;
 }
 function create(index,seed=0){return {index,seed,mission:missions[index],events:course(index,seed),row:0,distance:0,lane:0,x:0,y:0,vy:0,coins:0,hits:0,lives:3,invulnerable:0,time:0,status:'ready',jumpCount:0,hop:null};}
 function move(s,dir){if(s.status!=='running'||s.hop||![-1,1].includes(dir))return false;
  const target=wrap(s.lane+dir);s.hop={from:s.lane,to:target,dir,elapsed:0,fromRow:s.row,wrapped:false};s.jumpCount++;return true;
 }
 function step(s,dt){if(s.status!=='running')return [];dt=Math.max(0,Math.min(dt,.05));s.invulnerable=Math.max(0,s.invulnerable-dt);if(!s.hop)return [];
  const h=s.hop,signals=[];h.elapsed=Math.min(HOP_TIME,h.elapsed+dt);s.time+=dt;const t=h.elapsed/HOP_TIME,e=t*t*(3-2*t),raw=h.from+h.dir*e;
  s.x=raw>1.5?raw-3:raw< -1.5?raw+3:raw;s.distance=(h.fromRow+e)*ROW;s.y=Math.sin(Math.PI*t)*1.75;s.vy=Math.cos(Math.PI*t)*1.75*Math.PI/HOP_TIME;
  if(!h.wrapped&&(raw>1.5||raw< -1.5)){h.wrapped=true;signals.push('wrap');}
  if(t<1)return signals;
  s.y=0;s.vy=0;s.x=s.lane=h.to;s.row=h.fromRow+1;s.distance=s.row*ROW;s.hop=null;signals.push('land');
  const event=s.events[s.row-1];
  if(event.hazards.some(o=>o.lane===s.lane)){
   s.hits++;s.lives--;s.invulnerable=.7;signals.push('hit');
   // A failed choice returns to the previous tile so the player can reconsider.
   s.row=h.fromRow;s.distance=s.row*ROW;s.x=s.lane=h.from;
   if(!s.lives){s.status='lost';signals.push('lost');}return signals;
  }
  event.checked=true;if(event.coinLane===s.lane&&!event.collected){event.collected=true;s.coins++;signals.push('coin');}
  if(s.row===s.mission.rows){s.status='won';signals.push('won');}return signals;
 }
 function coinTotal(s){return s.events.reduce((total,event)=>total+(event.coinLane===null?0:1),0);}
 function rating(s){if(s.status!=='won')return 0;const total=coinTotal(s),ratio=total?s.coins/total:1;return 1+(ratio>=.5?1:0)+(ratio>=.75&&s.hits===0?1:0);}
 function cleanSave(value){const stars=Array.from({length:6},(_,i)=>Math.max(0,Math.min(3,Math.floor(Number(value?.stars?.[i])||0))));let unlocked=0;while(unlocked<5&&stars[unlocked]>0)unlocked++;return {stars,unlocked};}
 return {missions,ROW,HOP_TIME,wrap,random,course,create,move,step,coinTotal,rating,cleanSave};
});
