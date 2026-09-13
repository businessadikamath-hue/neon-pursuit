import * as T from 'three';
import {blenderUltraScenery8} from '../engine/blenderUltraScenery8.js';
import {scenerySurface8,plantSurface8} from '../engine/scenerySurface8.js';
import {anchorNearJunction,routeBlockFor} from '../engine/sceneryPolicy.js';

// Original near-field details. This layer is allocated only on Ultra+ selection,
// shares its immutable art across LRU worlds, and owns its instance buffers.
const cache=new Map(),clock={value:0},rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function geometry(data){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));g.setIndex(data.i);g.computeBoundingSphere();g.userData.artShared=true;return g;}
function blades(biome,litter=false){
 const p=[],uv=[],colors=[],idx=[],r=rng(2721+biome.length),dry=biome==='desert',cold=biome==='tundra';
 const point=(x,y,z,u,v,c)=>{const n=p.length/3;p.push(x,y,z);uv.push(u,v);colors.push(c.r,c.g,c.b);return n;};
 const blade=(x,z,a,h,w,len,c)=>{const base=p.length/3;for(let j=0;j<=7;j++){const t=j/7,shape=Math.max(.02,Math.sin(t*Math.PI)),along=len*t,bend=litter?Math.sin(t*Math.PI)*.035:h*t;for(let k=-1;k<=1;k++){const ww=k*w*(litter?shape:1-t*.93),y=bend-Math.abs(k)*w*.2+Math.sin(t*5)*h*.03;point(x+Math.sin(a)*along+Math.cos(a)*ww,y,z+Math.cos(a)*along-Math.sin(a)*ww,(k+1)/2,t,c);}}for(let j=0;j<7;j++)for(let k=0;k<2;k++){const n=base+j*3+k;idx.push(n,n+1,n+3,n+1,n+4,n+3);}};
 const n=litter?9:11;for(let k=0;k<n;k++){const a=k*2.399+r()*.5,c=new T.Color().setHSL(litter?.10:dry?.13:cold?.14:.25,litter?.22:dry?.28:cold?.13:.34,litter?.22:dry?.39:cold?.47:.29);const h=(dry?.32:cold?.24:.58)*(.62+r()*.75),x=Math.sin(a)*r()*(litter?.39:.13),z=Math.cos(a)*r()*(litter?.39:.13);blade(x,z,a,litter?.025:h,litter?.035+r()*.035:.008+r()*.010,litter?.12+r()*.18:h*.39,c);
  // Individually modeled tapered seed husks follow the grass stem; they are
  // small enough to read as grass inflorescences rather than oversized beads.
  if(!litter&&k%3===0)for(let seed=0;seed<7;seed++){const t=.66+seed*.045,xx=x+Math.sin(a)*h*.39*t,zz=z+Math.cos(a)*h*.39*t,yy=h*t,b=p.length/3,c2=new T.Color(c).multiplyScalar(1.22);point(xx-.012,yy,zz,0,0,c2);point(xx+.012,yy,zz,1,0,c2);point(xx,yy+.026,zz+.010,.5,1,c2);point(xx,yy+.014,zz-.010,.5,.5,c2);idx.push(b,b+1,b+2,b,b+3,b+1,b,b+2,b+3,b+1,b+3,b+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();g.userData.artShared=true;return g;
}
function resources(biome){
 if(cache.has(biome))return cache.get(biome);
 const stone=new T.MeshStandardMaterial({color:biome==='desert'?0xc4ad92:biome==='tundra'?0xb2bdc4:0x91968b,...scenerySurface8('rock',true),roughness:1,normalScale:new T.Vector2(.54,.54)}),wood=new T.MeshStandardMaterial({color:0x8a7963,...plantSurface8('bark'),roughness:1,normalScale:new T.Vector2(.46,.46)}),shell=new T.MeshStandardMaterial({color:0xb6b1a0,roughness:.85,...scenerySurface8('sand',true),normalScale:new T.Vector2(.12,.12)});
 const litter=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.99,...plantSurface8('leaf'),normalScale:new T.Vector2(.26,.26)}),grass=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.95});
 grass.onBeforeCompile=s=>{s.uniforms.ultraGrassTime=clock;s.vertexShader='uniform float ultraGrassTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec2 ultraOrigin=vec2(0.0);
 #ifdef USE_INSTANCING
 ultraOrigin=instanceMatrix[3].xz;
 #endif
 float ultraBend=pow(clamp(position.y/.8,0.,1.),2.);
 transformed.x+=sin(ultraGrassTime*1.4+ultraOrigin.x*.4+ultraOrigin.y*.2)*ultraBend*.08;
 transformed.z+=cos(ultraGrassTime*.8+ultraOrigin.y*.19)*ultraBend*.035;
 `);};grass.customProgramCacheKey=()=> 'treeArt-ultra-ground-v8';
 const names=['layered-scree','tide-smoothed-cobble','broken-slate','weathered-forked-driftwood','ribbed-shore-shell'],shapes=names.map(name=>geometry(blenderUltraScenery8[name]));
 const specs=[{geometry:blades(biome),material:grass,name:'Fine grass blades and seedheads',count:440,scale:.70,range:.8},{geometry:blades(biome,true),material:litter,name:'Curled fallen leaf litter',count:biome==='jungle'?330:biome==='coastline'?150:45,scale:.65,range:.8},{geometry:shapes[biome==='desert'?0:2],material:stone,name:'Eroded shoulder stones',count:58,scale:.12,range:.25},{geometry:shapes[3],material:wood,name:'Broken fallen branches',count:biome==='jungle'?12:6,scale:.35,range:.40}];
 if(biome==='coastline')specs.push({geometry:shapes[1],material:stone,name:'Tide-line cobbles',count:85,scale:.10,range:.21,shore:true},{geometry:shapes[4],material:shell,name:'Ribbed stranded shells',count:40,scale:.18,range:.15,shore:true},{geometry:shapes[3],material:wood,name:'Weathered forked driftwood',count:5,scale:.55,range:.6,shore:true});
 for(const m of[stone,wood,shell,litter,grass])m.userData.artShared=true;const result={specs};cache.set(biome,result);return result;
}
export function installUltraScenery(world,biome){
 const groups=[],dummy=new T.Object3D();let current=world.preset||'High',created=false,groundInstances=0,shorelineInstances=0;
 function create(){
  if(created)return;created=true;const res=resources(biome);
  for(const [ti,tile]of world.tiles.entries()){
   const root=new T.Group();root.name='Ultra+ close roadside and shoreline';root.userData.ultraScenery=true;root.visible=false;tile.add(root);const r=rng(8197+ti*137);
   for(const spec of res.specs){const mesh=new T.InstancedMesh(spec.geometry,spec.material,spec.count),matrices=[];mesh.name=spec.name;mesh.userData.ultraScenery=true;mesh.castShadow=!spec.name.includes('grass');mesh.receiveShadow=true;mesh.count=0;mesh.visible=false;mesh.frustumCulled=false;
    for(let i=0;i<spec.count;i++){const grove=i%11,z=T.MathUtils.clamp(-8-grove*14+(r()-.5)*10,-156,-3),side=i%2?1:-1,x=spec.shore?-33-r()*8:side*(15.7+(i%3)*1.9+r()*1.65),size=spec.scale+r()*spec.range;const h=tile.userData.terrainHeight?.(x,z)??-.1;dummy.position.set(x,h+.005,z);dummy.rotation.set(0,r()*Math.PI*2,0);dummy.scale.set(size,size*(.78+r()*.34),size);dummy.updateMatrix();matrices.push(dummy.matrix.clone());mesh.setColorAt(i,new T.Color().setScalar(.78+r()*.22));}
    root.add(mesh);groups.push({root,tile,mesh,matrices,shore:!!spec.shore,key:null});
   }world.bindRoute?.(root);
  }
 }
 function refresh(){
  groundInstances=shorelineInstances=0;const active=current==='Ultra+';if(active)create();
  for(const g of groups){g.root.visible=active;g.mesh.visible=active;if(!active){g.mesh.count=0;g.key=null;continue;}const c=world.scenePolicyClearance,block=c?routeBlockFor(g.tile,c.distance):g.tile.userData.routeBlock||0,offset=c?c.distance-block*160:g.tile.position.z,key=block+':'+c?.junctionPosition+':'+Math.floor(offset/10);if(key!==g.key){let n=0;for(const matrix of g.matrices){const e=matrix.elements,z=e[14]+offset;if(z< -115||z>24||anchorNearJunction(world,g.tile,e[12],e[14],16))continue;g.mesh.setMatrixAt(n++,matrix);}g.mesh.count=n;g.mesh.instanceMatrix.needsUpdate=true;g.key=key;}if(g.tile.visible){if(g.shore)shorelineInstances+=g.mesh.count;else groundInstances+=g.mesh.count;}}
 }
 const quality=world.quality;world.quality=q=>{quality(q);current=q;refresh();};const update=world.update;world.update=(distance,time,x)=>{update(distance,time,x);clock.value=time;refresh();};const details=world.details;world.details=()=>({...details(),ultraScenery:{active:current==='Ultra+',materialResolution:current==='Ultra+'?1024:0,groundInstances,shorelineInstances,resourcesCreated:created,routeBound:groups.every(g=>!!g.mesh.customDepthMaterial&&!!g.mesh.material.userData.preRouteKey),suppressedOutsideUltra:current==='Ultra+'||groups.every(g=>!g.mesh.visible&&g.mesh.count===0),placement:'Terrain sampled near-field clumps with road and dynamic junction setbacks'}});
 world.ultraSceneryArt={groups,refresh};return world;
}

export {blades,resources};
