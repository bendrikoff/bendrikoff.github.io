import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class AnimatedDogelon extends THREE.Group{
 constructor(){super();this.ready=this.load();}
 async load(){
  const gltf=await new GLTFLoader().loadAsync('assets/shiba-astronaut.glb');
  this.asset=gltf.scene;this.pivot=new THREE.Group();this.add(this.pivot);this.pivot.add(this.asset);
  this.asset.rotation.y=Math.PI; // GLB faces +Z; the course runs toward -Z.
  this.asset.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  this.mixer=new THREE.AnimationMixer(this.asset);this.actions={};
  for(const original of gltf.animations){
   const clip=original.clone();
   // Preserve authored poses/materials, but let the board own root translation.
   clip.tracks=clip.tracks.filter(t=>t.name!=='root.position');
   const action=this.mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;this.actions[clip.name]=action;
  }
  if(!this.actions.Jump_Left||!this.actions.Jump_Right)throw new Error('The Shiba model is missing its jump animations.');
  this.pose(this.actions.Idle?'Idle':'Jump_Left',0,0,true);
  this.asset.updateMatrixWorld(true);this.asset.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(this.asset),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const scale=2.65/size.y;this.pivot.scale.setScalar(scale);this.asset.position.set(-center.x,-box.min.y,-center.z);
  this.loaded=true;
 }
 pose(name,time,dt=.016,instant=false){const action=this.actions[name];if(!action)return;
  if(this.action!==action){this.action=action;action.reset().setEffectiveWeight(0).play();action.paused=true;}
  // Blend outgoing poses instead of snapping from the end of a jump to idle.
  const blend=instant?1:1-Math.exp(-Math.max(0,dt)*24);
  for(const other of Object.values(this.actions)){
   const target=other===action?1:0;
   other.setEffectiveWeight(THREE.MathUtils.lerp(other.getEffectiveWeight(),target,blend));
   if(other!==action&&other.getEffectiveWeight()<.001)other.stop();
  }
  action.paused=true;action.time=Math.min(time,action.getClip().duration);this.mixer.update(0);
 }
 animate(state,time,reduced,dt=.016){if(!this.loaded)return;
  if(state!==this.state){this.state=state;this.lastJump=null;this.idleName='Jump_Left';this.idleTime=0;}
  if(state?.status==='paused')return;
  this.idleTime+=dt;
  if(state?.hop){
   // Rotating the asset by PI swaps its local left/right relative to the board.
   const name=state.hop.dir<0?'Jump_Right':'Jump_Left';
   this.pose(name,state.hop.elapsed/window.MarsCore.HOP_TIME*this.actions[name].getClip().duration,dt);
   this.idleName=name;this.lastJump=state.jumpCount;
  }else if(this.actions.Idle){
   this.pose('Idle',this.idleTime%this.actions.Idle.getClip().duration,dt);
  }else if(state?.status==='ready'){
   const action=this.actions.Run_InPlace;this.pose('Run_InPlace',time%action.getClip().duration,dt);
  }else{
   this.pose(this.idleName,this.lastJump===null?0:this.actions[this.idleName].getClip().duration,dt);
  }
 }
}
