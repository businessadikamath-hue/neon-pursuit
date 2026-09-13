import * as T from 'three';

export function routeBlockFor(tile,distance){let block=tile.userData.routeBlock??0;while(distance-block*160>320)block+=5;while(distance-block*160< -640)block-=5;return block;}
export function anchorNearJunction(world,tile,x,z,margin=14){const c=world.scenePolicyClearance;if(!c||!Number.isFinite(c.junctionPosition)||Math.abs(x)>=55)return false;return Math.abs(routeBlockFor(tile,c.distance)*160-z-c.junctionPosition)<margin;}

// Install after route construction and before adding the player/traffic. Route
// lights, signs and road paint should carry userData.gameOnlyKeep=true.
export function installScenePolicy(world,renderer){
 const kept=o=>{for(let p=o;p;p=p.parent)if(p.userData.gameOnlyKeep)return true;return false;};
 const scenery=[],props=[];world.scene.traverse(o=>{if((o.isMesh||o.isPoints||o.isLine)&&!kept(o))scenery.push(o)});world.tiles.forEach(tile=>tile.traverse(m=>{if(m.userData.junctionClearance)props.push({tile,mesh:m,base:m.instanceMatrix.array.slice(),key:null})}));
 let minimal=false,saved=new Map(),environment=world.scene.environment,background=world.scene.background,fog=world.scene.fog;const minimalBackground=new T.Color(0x34434e),dynamicShadows=new Map();
 const priorClearance=world.setJunctionClearance;world.setJunctionClearance=(distance,junctionPosition)=>{world.scenePolicyClearance={distance,junctionPosition};priorClearance?.(distance,junctionPosition);};
 const remember=()=>{saved=new Map(scenery.map(o=>[o,{visible:o.visible,count:o.isInstancedMesh?o.count:null}]));environment=world.scene.environment;background=world.scene.background;fog=world.scene.fog;};
 const hide=o=>{if(!o)return;o.visible=false;if(o.isInstancedMesh)o.count=0;};
 function apply(){
   if(!minimal)return;scenery.forEach(hide);const ocean=world.ocean?.();hide(ocean?.water);hide(ocean?.foam);hide(world.water);hide(world.hills);hide(world.weatherObject);hide(world.wildlifeArtRoot);hide(world.wildlifeArt?.air);
   world.scene.traverse(m=>{if(!m.isMesh||m.geometry.type!=='PlaneGeometry')return;const mat=m.material;if(mat?.isMeshBasicMaterial&&mat.transparent&&mat.depthWrite===false){if(!dynamicShadows.has(m))dynamicShadows.set(m,m.visible);m.visible=false;}});
   renderer.shadowMap.enabled=false;renderer.shadowMap.needsUpdate=false;world.scene.environment=null;world.scene.background=minimalBackground;world.scene.fog=null;
 }
 const quality=world.quality;world.quality=q=>{const next=q==='Game Only';if(next&&!minimal)remember();if(!next&&minimal){saved.forEach((v,o)=>{o.visible=v.visible;if(v.count!==null)o.count=v.count;});dynamicShadows.forEach((visible,o)=>o.visible=visible);dynamicShadows.clear();world.scene.environment=environment;world.scene.background=background;world.scene.fog=fog;world.reflectionDirty=true;}minimal=next;quality(q);apply();};
 const lighting=world.lighting;world.lighting=day=>{if(minimal)world.scene.fog=fog;lighting(day);if(minimal){fog=world.scene.fog;apply();}};
 const update=world.update;world.update=(distance,time,x)=>{update(distance,time,x);if(!minimal)for(const p of props){const c=world.scenePolicyClearance,key=c?routeBlockFor(p.tile,c.distance)+':'+c.junctionPosition:'none';if(p.key===key)continue;let n=0;for(let i=0;i<p.base.length;i+=16){if(anchorNearJunction(world,p.tile,p.base[i+12],p.base[i+14],15))continue;p.mesh.instanceMatrix.array.set(p.base.subarray(i,i+16),n++*16);}p.mesh.count=n;p.mesh.instanceMatrix.needsUpdate=true;p.key=key;}apply();};
 const reflect=world.reflections;world.reflections=player=>{if(!minimal)return reflect?.(player);world.reflectionDirty=false;player?.traverse(m=>{if(!m.isMesh)return;for(const mat of Array.isArray(m.material)?m.material:[m.material])if(mat.envMap){mat.envMap=null;mat.needsUpdate=true;}});apply();};
 const details=world.details;world.details=()=>{const d=details();return minimal?{...d,preset:'Game Only',gameOnly:true,individualLeaves:0,visibleAuthoredTrees:0,authoredTrees:0,groundDetail:0,grassTufts:0,grassStrands:0,wildlife:0,birds:0,pineNeedles:0,canopyCards:0,understoryPlants:0,weather:'disabled',terrainTiles:0,reflectiveOcean:false,clearShallows:false,localCarReflection:false,reflectionResolution:0,reflectionHz:0,shadowSize:0,shadowCascades:0,waterSegments:null,natureHazards:0}: {...d,gameOnly:false};};
 const dispose=world.disposeWorldArt;world.disposeWorldArt=()=>{dispose?.();if(world.scene.environment!==environment)environment?.dispose();dynamicShadows.clear();saved.clear();};
 world.scenePolicy={scenery,apply,get gameOnly(){return minimal}};return world;
}
