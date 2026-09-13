import * as T from 'three';

// One broad daylight rig owns the final settings after biome/material setup.
// The directional sun lights the full scene; only night driving uses spotlights.
export function installLighting(world,renderer,biome){
 const previous=world.lighting;let currentDay='afternoon';
 world.lighting=day=>{
  previous(day);currentDay=day;
  const night=day==='night',morning=day==='morning',ice=biome==='tundra';
  world.sun.position.set(night?-85:morning?-125:-105,night?115:morning?92:168,night?-55:morning?-74:-85);
  world.sun.target.position.set(0,0,-18);
  const direction=new T.Vector3().subVectors(world.sun.position,world.sun.target.position).normalize();
  world.skyMat.uniforms.sunDir.value.copy(direction);
  world.sun.color.set(night?0xa5bedf:morning?0xffe5bc:0xfff3df);
  world.sun.intensity=night?.34:ice?2.65:biome==='jungle'?3.25:3.45;
  world.hemi.color.set(night?0x8ba5ca:ice?0xc2d5e7:0xb5cfe9);
  world.hemi.groundColor.set(night?0x35414d:ice?0x9eafb8:biome==='desert'?0x8e8067:0x535c43);
  world.hemi.intensity=night?.38:ice?.92:biome==='jungle'?.96:.82;
  Object.assign(world.sun.shadow.camera,{left:-61,right:61,top:88,bottom:-88,near:.5,far:450});
  world.sun.shadow.camera.updateProjectionMatrix();
  world.sun.shadow.radius=2.8;world.sun.shadow.bias=-.00008;world.sun.shadow.normalBias=.018;
  renderer.toneMappingExposure=night?.95:ice?.83:.91;
  world.scene.environmentIntensity=night?.20:.72;
  if(world.scene.fog){world.scene.fog.color.set(night?({coastline:0x34485d,tundra:0x3d5167,desert:0x4c4852,jungle:0x263e3c}[biome]):({coastline:0xb7c8d2,tundra:0xcbd9e2,desert:0xd4c2a4,jungle:0xa0b5aa}[biome]));world.scene.fog.density=night?.0026:biome==='jungle'?.0021:ice?.00165:.00115;}
  world.skyMat.uniforms.top.value.set(night?0x07132d:ice?0x789eb8:morning?0x4e8eb8:0x377bab);
  world.skyMat.uniforms.bottom.value.set(night?0x24384c:ice?0xcbdce6:morning?0xe1d8c5:0xc8dbe6);
  const water=world.ocean?.().water;
  if(water){water.material.uniforms.sunDirection.value.copy(direction);water.material.uniforms.sunColor.value.copy(world.sun.color).multiplyScalar(night?.15:1.02);water.material.uniforms.waterColor.value.set(night?0x092537:0x195764);}
  world.scene.traverse(o=>{if(o.isSpotLight&&!night)o.intensity=0;});
  world.reflectionDirty=true;
 };
 const details=world.details;
 world.details=()=>{const headlights=[];world.scene.traverse(o=>{if(o.isSpotLight)headlights.push(o.intensity)});return {...details(),lighting:{model:'v9 broad directional sun, cooler sky fill, restrained ground bounce and local PBR environment',day:currentDay,sun:world.sun.position.toArray(),target:world.sun.target.position.toArray(),sunIntensity:world.sun.intensity,fillIntensity:world.hemi.intensity,exposure:renderer.toneMappingExposure,headlightIntensities:headlights,daytimeSpotlight:currentDay!=='night'&&headlights.some(n=>n>0)}}};
 return world;
}
