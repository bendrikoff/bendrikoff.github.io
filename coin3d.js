import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

function flareTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const g=canvas.getContext('2d');
 const glow=g.createRadialGradient(64,64,0,64,64,62);glow.addColorStop(0,'rgba(255,255,235,1)');glow.addColorStop(.12,'rgba(255,222,116,.95)');glow.addColorStop(.42,'rgba(255,157,39,.26)');glow.addColorStop(1,'rgba(255,145,20,0)');g.fillStyle=glow;g.fillRect(0,0,128,128);
 g.globalCompositeOperation='screen';const beam=g.createLinearGradient(0,64,128,64);beam.addColorStop(0,'rgba(255,255,255,0)');beam.addColorStop(.46,'rgba(255,245,192,.1)');beam.addColorStop(.5,'rgba(255,255,255,.95)');beam.addColorStop(.54,'rgba(255,245,192,.1)');beam.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=beam;g.fillRect(0,58,128,12);g.save();g.translate(64,64);g.rotate(Math.PI/2);g.translate(-64,-64);g.fillRect(0,60,128,8);g.restore();
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export class CoinAsset{
 constructor(){this.template=null;this.flare=flareTexture();this.ready=new GLTFLoader().loadAsync('assets/coin_with_artwork.glb').then(gltf=>{this.template=gltf.scene;this.template.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.sharedCoinAsset=true;}});});}
 clone(phase=0){
  const coin=new THREE.Group(),model=this.template.clone(true);model.rotation.x=Math.PI/2;model.scale.setScalar(.48);coin.add(model);
  const sparkle=new THREE.Sprite(new THREE.SpriteMaterial({map:this.flare,color:0xffd36a,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));sparkle.position.set(.28,.27,.18);sparkle.scale.setScalar(.48);sparkle.userData.sharedCoinAsset=true;coin.add(sparkle);
  coin.userData={model,sparkle,phase};return coin;
 }
}
