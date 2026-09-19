import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SolarMap} from './solar-map.js';
import {RunnerEffects} from './effects3d.js';
import {createScenery} from './scenery3d.js';
import {AnimatedDogelon} from './hero3d.js';
import {CoinAsset} from './coin3d.js';

// User-provided animated Shiba GLB with its original embedded texture atlas.
// World geometry is procedural; the hero and all textures are served locally.
const THEMES = [
 {sky:0x17152b,fog:0x6f3426,floor:0xee823a,wall:0xba4e22,light:0xffd4a1,planet:0x346080,kind:'canyon',name:'SUNLIT CANYON'},
 {sky:0x080e23,fog:0x34394b,floor:0xa1a2b0,wall:0x676b80,light:0xd4e1ff,planet:0xd0633c,kind:'moon',name:'LUNAR QUARRY'},
 {sky:0x062332,fog:0x377582,floor:0x92e3e3,wall:0x2f959f,light:0xb9ffff,planet:0x669dd5,kind:'ice',name:'FROZEN RIFT'},
 {sky:0x27132a,fog:0x963c31,floor:0xd96343,wall:0x9c2927,light:0xffb988,planet:0xc89b78,kind:'arches',name:'SCARLET GORGE'},
 {sky:0x170d21,fog:0x3b2230,floor:0x66505d,wall:0x352f40,light:0xffb299,planet:0xb6433c,kind:'lava',name:'VOLCANIC RIDGE'},
 {sky:0x101e32,fog:0x4c5b69,floor:0xb9b6a2,wall:0x526779,light:0xe0fbff,planet:0xf28a55,kind:'colony',name:'MARS COLONY'}
];
const unitBox=new THREE.BoxGeometry(1,1,1);
function mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.82,flatShading:true,...extra});}
function mesh(parent,geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function block(p,m,x,y,z,w,h,d){return mesh(p,unitBox,m,x,y,z,w,h,d);}
function seeded(n){return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
function texture(kind){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),rng=seeded(247);g.fillStyle='#ded6c9';g.fillRect(0,0,128,128);
 for(let i=0;i<1500;i++){const v=130+rng()*110;g.fillStyle=`rgba(${v},${v},${v},.22)`;g.fillRect(rng()*128,rng()*128,1+rng()*3,1);}
 g.strokeStyle='#524d4660';g.lineWidth=1;
 if(kind==='colony'){g.strokeRect(5,5,118,118);g.strokeRect(10,10,108,108);g.fillStyle='#333944';for(const x of [13,112])for(const y of [13,112])g.fillRect(x,y,3,3);}
 else{for(let i=0;i<17;i++){let x=rng()*128,y=rng()*128;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=(rng()-.5)*30;y+=(rng()-.5)*30;g.lineTo(x,y);}g.stroke();}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;return t;
}
class MarsRenderer{
 constructor(canvas){this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;
 this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(56,1,.1,450);this.cameraTarget=new THREE.Vector3();this.cameraRoll=0;this.cameraClock=0;this.world=new THREE.Group();this.scene.add(this.world);this.hero=new AnimatedDogelon();this.coins=new CoinAsset();this.ready=Promise.all([this.hero.ready,this.coins.ready]);this.scene.add(this.hero);
 this.ambient=new THREE.HemisphereLight(0xe3eeff,0x4f2520,2.5);this.scene.add(this.ambient);this.sun=new THREE.DirectionalLight(0xffd5aa,3);this.sun.position.set(-12,25,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-13,right:13,top:15,bottom:-15,near:1,far:70});this.sun.shadow.bias=-.001;this.scene.add(this.sun);
 const rng=seeded(100),positions=[];for(let i=0;i<700;i++)positions.push((rng()-.5)*350,15+rng()*150,-80-rng()*230);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.starfield=new THREE.Points(sg,new THREE.PointsMaterial({color:0xdce9ff,size:.25,sizeAttenuation:true}));this.scene.add(this.starfield);
 this.dummy=new THREE.Object3D();this.index=-1;this.currentState=null;this.mode='menu';this.setTheme(0);
 this.solar=new SolarMap(canvas,document.getElementById('map-interaction'));this.fx=new RunnerEffects(this.scene);
 this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new THREE.Vector2(512,512),.38,.45,1.05);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());this.resize(innerWidth,innerHeight);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.dispatchEvent(new Event('mars-renderer-lost'));});canvas.addEventListener('webglcontextrestored',()=>location.reload());
 }
 resize(w,h){this.width=w;this.height=h;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.solar?.resize(w,h);this.composer?.setSize(w,h);}
 clearWorld(){const geometries=new Set(),materials=new Set(),textures=new Set();this.world.traverse(o=>{if(o.userData.sharedCoinAsset)return;if(o.geometry&&o.geometry!==unitBox)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);if(m.map)textures.add(m.map);}});this.world.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 setTheme(index){if(this.index===index)return;this.index=index;this.theme=THEMES[index];this.clearWorld();const t=this.theme;this.scene.background=new THREE.Color(t.sky);this.scene.fog=new THREE.Fog(t.fog,48,180);this.sun.color.set(t.light);this.ambient.groundColor.set(t.wall);
 const tileMat=mat(t.floor,{map:texture(t.kind),roughness:t.kind==='ice'?.28:.95});this.tiles=new THREE.InstancedMesh(unitBox,tileMat,180);this.tiles.receiveShadow=true;this.tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.world.add(this.tiles);
 this.cliffs=new THREE.InstancedMesh(unitBox,mat(t.wall,{map:texture('rock')}),240);this.cliffs.receiveShadow=true;this.cliffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.world.add(this.cliffs);
 this.props=[];const rockMat=mat(t.kind==='ice'?0xbefaff:t.wall,{roughness:.5});const glowMat=mat(t.kind==='lava'?0xff4a0b:0x8aebe9,{emissive:t.kind==='lava'?0xff3300:0x228b91,emissiveIntensity:t.kind==='lava'?2:.7});
 for(let i=0;i<20;i++){const p=new THREE.Group(),side=i%2?1:-1;p.userData={side,offset:i*14};
 if(t.kind==='ice'){for(let n=0;n<3;n++){const s=mesh(p,new THREE.ConeGeometry(.5,3+n,5),rockMat,(n-1)*.6,1.8,0);s.rotation.z=(n-1)*.25;}}
 else if(t.kind==='moon'){mesh(p,new THREE.IcosahedronGeometry(1.2,0),rockMat,0,.8,0,1,1.5,1);}
 else if(t.kind==='colony'){block(p,mat(0xbacbd0),0,1.8,0,2.4,3.6,3);block(p,mat(0x29445d),0,3.7,0,2.7,.25,3.3);block(p,glowMat,-side*1.22,2,0,.03,.45,1.8);const antenna=block(p,rockMat,0,4.7,0,.12,2,.12);}
 else if(t.kind==='lava'){mesh(p,new THREE.ConeGeometry(1.1,3.7,5),rockMat,0,1.5,0);block(p,glowMat,0,.1,0,2.8,.05,4);}
 else if(t.kind==='arches'){block(p,rockMat,0,2.5,0,1.5,5,1.8);block(p,rockMat,-side*1.4,5.1,0,4.3,.9,2);}
 else{mesh(p,new THREE.DodecahedronGeometry(.7,0),rockMat,0,.5,0,1.2,.9,1.5);}
 this.world.add(p);this.props.push(p);}
 this.planet=mesh(this.world,new THREE.SphereGeometry(20,32,20),mat(t.planet,{map:texture('rock'),roughness:1}),16,30,-115);this.planet.castShadow=false;this.planet.receiveShadow=false;
 const atmosphere=mesh(this.world,new THREE.SphereGeometry(20.5,32,20),new THREE.MeshBasicMaterial({color:t.planet,transparent:true,opacity:.08,side:THREE.BackSide}),16,30,-115);atmosphere.castShadow=false;
 if(t.kind==='ice'||t.kind==='moon'){const ring=mesh(this.world,new THREE.RingGeometry(24,32,64),new THREE.MeshBasicMaterial({color:t.light,side:THREE.DoubleSide,transparent:true,opacity:.25}),16,30,-115);ring.rotation.x=1.1;ring.rotation.z=.3;}
 const under=mat(t.kind==='lava'?0xe9420a:0x161b2a,{emissive:t.kind==='lava'?0xff2a00:0x000000,emissiveIntensity:1});mesh(this.world,new THREE.PlaneGeometry(170,360),under,0,-4,-120).rotation.x=-Math.PI/2;
 this.eventGroup=new THREE.Group();this.world.add(this.eventGroup);this.events=[];this.currentState=null;
 this.finish=new THREE.Group();for(const side of [-1,1])block(this.finish,mat(0xf9b64a),side*3.45,2.5,0,.42,5,.5);
 for(let row=0;row<2;row++)for(let col=0;col<12;col++)block(this.finish,mat((row+col)%2?0x152033:0xf8edcb),-3.3+col*.6,4.5+row*.4,0,.6,.4,.16);
 this.world.add(this.finish);
 this.matrixColor=new THREE.Color();this.scenery=createScenery(this.world,t);
 }
 setCourse(state){this.cameraSettled=false;this.cameraRoll=0;this.tileImpacts=new Map();this.currentState=state;this.fx?.reset();const geometries=new Set(),materials=new Set();this.eventGroup.traverse(o=>{if(o.userData.sharedCoinAsset)return;if(o.geometry&&o.geometry!==unitBox)geometries.add(o.geometry);if(o.material)materials.add(o.material);});this.eventGroup.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.events=[];this.gaps=new Set();if(!state)return;
 const rockMat=mat(this.theme.kind==='ice'?0xe0ffff:0x716878),spikeMat=mat(0xd8d7cd,{metalness:.45,roughness:.4});
 const rockGeo=new THREE.DodecahedronGeometry(.67,0),spikeGeo=new THREE.ConeGeometry(.16,1.12,5);
 for(const e of state.events){const group=new THREE.Group();group.userData.event=e;for(const h of e.hazards){if(h.type==='gap'){this.gaps.add(`${Math.round(e.z/3)}:${h.lane}`);continue;}if(h.type==='spikes'){block(group,rockMat,h.lane*2.2,.08,0,1.6,.15,1.35);for(let x=0;x<3;x++)for(let z=0;z<2;z++)mesh(group,spikeGeo,spikeMat,h.lane*2.2+(x-1)*.48,.63,(z-.5)*.6);}else{mesh(group,rockGeo,rockMat,h.lane*2.2,.6,0,1.1,.95,1);}}
 if(e.coinLane!==null){const coin=this.coins.clone(e.row*.73);coin.position.set(e.coinLane*2.2,1.1,0);group.add(coin);group.userData.coin=coin;}this.eventGroup.add(group);this.events.push(group);}
 }
 landTile(state,reduced){if(!this.tileImpacts)this.tileImpacts=new Map();this.tileImpacts.set(state.row+':'+state.lane,{age:0,amplitude:reduced?.055:.25});}
 tileOffset(row,lane){const impact=this.tileImpacts?.get(row+':'+lane);return impact?-impact.amplitude*Math.sin(impact.age*16)*Math.exp(-impact.age*5):0;}
 matrix(instance,i,x,y,z,sx,sy,sz,shade=1){this.dummy.position.set(x,y,z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();instance.setMatrixAt(i,this.dummy.matrix);this.matrixColor.setRGB(shade,shade,shade);instance.setColorAt(i,this.matrixColor);}
 draw(state,index,time,mode,reduced,dt=.016){const inMenu=mode==='menu';this.solar.controls.enabled=inMenu&&document.getElementById('overlay').classList.contains('hidden');
 if(inMenu){this.mode='menu';this.fx.root.visible=false;document.getElementById('screen-fx').style.opacity='0';this.solar.render(this.renderer,time,index,reduced);return;}
 this.setTheme(index);if(state!==this.currentState)this.setCourse(state);this.mode=mode;this.world.visible=true;this.starfield.visible=true;this.hero.visible=true;const animTime=state?.status==='paused'?state.time:time;
 {this.scene.background.set(this.theme.sky);this.scene.fog??=new THREE.Fog(this.theme.fog,48,180);
 const distance=state?.distance||0,start=Math.floor(distance/3);let tileIndex=0,cliffIndex=0;
 this.scenery.update(distance,animTime,reduced);
 if(state?.status!=='paused')for(const [key,impact] of this.tileImpacts||[]){impact.age+=dt;if(impact.age>.85)this.tileImpacts.delete(key);}
 for(let r=-4;r<56;r++){const row=start+r,z=distance-row*3;for(let lane=-1;lane<=1;lane++){const gap=this.gaps?.has(`${row}:${lane}`);this.matrix(this.tiles,tileIndex++,lane*2.2,gap?-8:-.18+this.tileOffset(row,lane),z,2.12,gap?.01:.36,2.89,.82+(Math.sin(row*37+lane*9)*.5+.5)*.28);}
 for(const side of [-1,1]){const wave=Math.sin(row*1.72+side)*.5+.5;const lunar=this.theme.kind==='moon',colony=this.theme.kind==='colony',h=colony?.38:lunar?.4+wave*1.5:1.2+wave*2.3;
 this.matrix(this.cliffs,cliffIndex++,side*4.3,h/2-.15,z,2.2,h,2.98,.85+wave*.25);this.matrix(this.cliffs,cliffIndex++,side*7.7,(h+1.7)/2-.3,z,4.5,h+1.7,2.99,.7+wave*.25);}}
 this.tiles.instanceMatrix.needsUpdate=this.cliffs.instanceMatrix.needsUpdate=true;this.tiles.instanceColor.needsUpdate=this.cliffs.instanceColor.needsUpdate=true;this.tiles.frustumCulled=this.cliffs.frustumCulled=false;
 for(const p of this.props){const z=12-((p.userData.offset-distance)%288+288)%288;p.position.set(p.userData.side*(this.theme.kind==='colony'?6:5.1),this.theme.kind==='colony'?0:2,z);}
 for(const group of this.events){const e=group.userData.event,z=distance-e.z;group.position.z=z;group.visible=z<7&&z> -165;const coin=group.userData.coin;if(coin){coin.visible=!e.collected;const phase=coin.userData.phase;coin.rotation.y=animTime*2.35+phase;coin.position.y=1.1+(reduced?0:Math.sin(animTime*2.8+phase)*.12);const shine=Math.pow(Math.max(0,Math.sin(animTime*3.7+phase)),8);coin.userData.sparkle.material.opacity=.18+shine*.82;coin.userData.sparkle.scale.setScalar(.38+shine*.44);coin.userData.sparkle.material.rotation=animTime*.5;}}
 this.finish.position.z=distance-(state?.mission.length||600);this.hero.position.set((state?.x||0)*2.2,(state?.y||0)+(state&&!state.hop?this.tileOffset(state.row,state.lane):0),0);this.hero.scale.setScalar(1);this.hero.rotation.y=state?.status==='ready'?Math.PI+.35:-(state?.hop?.dir||0)*.26;this.hero.rotation.z=-(state?.hop?.dir||0)*.1;
 if(state?.invulnerable>0)this.hero.visible=Math.floor(time*12)%2===0;
 }
 this.hero.animate(state,animTime,reduced,dt);
 this.fx.update(dt,state,time,this.theme.kind,reduced);
 // Stay centered across edge wraps. Ease small impulses instead of moving the view with the teleport.
 if(state?.status!=='paused'||!this.cameraSettled){
  this.cameraClock+=dt;
  const portrait=this.width/this.height<.8,impact=reduced?0:this.fx.shake*.18,t=this.cameraClock;
  this.cameraTarget.set(Math.sin(t*11)*impact,(portrait?6.2:5.6)+(reduced?0:this.fx.kick*.2+(state?.y||0)*.025+Math.cos(t*9)*impact*.3),(portrait?13.7:11.5)+(reduced?0:this.fx.boost*.055));
  const fov=(portrait?66:56)+(reduced?0:this.fx.boost*.5+(state?.y||0)*.12),blend=this.cameraSettled?1-Math.exp(-7*dt):1;
  this.camera.position.lerp(this.cameraTarget,blend);this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,fov,blend);
  this.cameraRoll=THREE.MathUtils.lerp(this.cameraRoll,reduced?0:-(state?.hop?.dir||0)*.003,blend);
  this.camera.lookAt(0,1,-20);this.camera.rotateZ(this.cameraRoll);this.cameraSettled=true;
 }
 this.camera.updateProjectionMatrix();if(this.width>=650)this.composer.render();else this.renderer.render(this.scene,this.camera);
 }
}
window.MarsRenderer=MarsRenderer;window.MARS_THEMES=THEMES;
