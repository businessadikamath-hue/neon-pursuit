import * as T from 'three';
import {photoSurface9} from './photoResources9.js';
const stochastic=`
vec2 surfaceHash9(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
vec4 surfaceSample9(sampler2D tex,vec2 uv){
 vec2 skew=vec2(uv.x-uv.y*.57735027,uv.y*1.15470054),cell=floor(skew),f=fract(skew);vec2 a,b,c;vec3 weights;
 if(f.x+f.y<1.){a=cell;b=cell+vec2(1,0);c=cell+vec2(0,1);weights=vec3(1.-f.x-f.y,f.x,f.y);}else{a=cell+vec2(1,1);b=cell+vec2(0,1);c=cell+vec2(1,0);weights=vec3(f.x+f.y-1.,1.-f.x,1.-f.y);}
 weights=pow(max(weights,vec3(0)),vec3(3));weights/=dot(weights,vec3(1));
 return texture2D(tex,uv+surfaceHash9(a))*weights.x+texture2D(tex,uv+surfaceHash9(b))*weights.y+texture2D(tex,uv+surfaceHash9(c))*weights.z;
}
`;
export function stochasticSurface9(mat){const compile=mat.onBeforeCompile,key=mat.customProgramCacheKey.bind(mat);mat.onBeforeCompile=shader=>{compile(shader);shader.fragmentShader=stochastic+shader.fragmentShader;for(const name of ['map_fragment','roughnessmap_fragment','normal_fragment_maps']){const code=T.ShaderChunk[name].replace(/texture2D\(\s*(map|normalMap|roughnessMap)\s*,\s*(vMapUv|vNormalMapUv|vRoughnessMapUv)\s*\)/g,'surfaceSample9($1,$2)');shader.fragmentShader=shader.fragmentShader.replace('#include <'+name+'>',code);}};mat.customProgramCacheKey=()=>key()+':stochastic-surface9';return mat;}
function beam(){const points=[];for(let i=0;i<=24;i++){const t=i/24;points.push(new T.Vector2(.043*Math.cos(t*Math.PI*4),-.17+t*.34));}const shape=new T.Shape([...points,...points.toReversed().map(p=>new T.Vector2(p.x-.004,p.y))]);const g=new T.ExtrudeGeometry(shape,{depth:4.97,steps:1,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:2});g.translate(0,0,-2.485);return g;}
function post(){const shape=new T.Shape([[-.064,-.048],[.064,-.048],[.064,-.039],[.005,-.039],[.005,.039],[.064,.039],[.064,.048],[-.064,.048],[-.064,.039],[-.005,.039],[-.005,-.039],[-.064,-.039]].map(p=>new T.Vector2(...p)));const g=new T.ExtrudeGeometry(shape,{depth:1.1,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2});g.rotateX(-Math.PI/2);g.translate(0,-.55,0);return g;}
export function installRoadCraft9(world,biome){
 const beamGeometry=beam(),postGeometry=post(),steel=new T.MeshStandardMaterial({color:0x81888b,metalness:.78,roughness:.48}),matrix=new T.Matrix4(),dummy=new T.Object3D();let beams=0,posts=0,bolts=0;const owned=[beamGeometry,postGeometry,steel];
 world.tiles.forEach(tile=>{
  tile.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.parameters;
   if(mesh.isInstancedMesh&&p?.width===.12&&p.depth===4.9){mesh.geometry=beamGeometry;mesh.material=steel;let upper=false;mesh.getMatrixAt(0,matrix);upper=matrix.elements[13]>1;if(upper){mesh.visible=false;mesh.userData.supersededRail9=true;}else{for(let i=0;i<mesh.instanceMatrix.count;i++){mesh.getMatrixAt(i,matrix);matrix.elements[13]=.84;mesh.setMatrixAt(i,matrix);}mesh.instanceMatrix.needsUpdate=true;beams+=mesh.count;}}
   if(mesh.isInstancedMesh&&p?.width===.12&&p.height===1.1&&p.depth===.12){mesh.geometry=postGeometry;mesh.material=steel;posts+=mesh.count;}
   if(p?.width===2&&p.height===.04&&p.depth===160){const maps=photoSurface9(biome==='tundra'?'snow':biome==='desert'?'rockroad':'road');if(maps){mesh.material=new T.MeshStandardMaterial({...maps,color:0xb0aea6,roughness:.95,normalScale:new T.Vector2(.25,.25)});owned.push(mesh.material);stochasticSurface9(mesh.material);}}
  });
  const geo=new T.CylinderGeometry(.015,.015,.012,6);geo.rotateZ(Math.PI/2);owned.push(geo);const fasteners=new T.InstancedMesh(geo,steel,128);fasteners.name='Galvanized guardrail attachment bolts';fasteners.userData.junctionClearance=true;fasteners.castShadow=fasteners.receiveShadow=true;let n=0;for(const side of [-1,1])for(let i=0;i<32;i++)for(const y of [.78,.90]){dummy.position.set(side*14.045,y,-i*5);dummy.rotation.set(0,0,0);dummy.updateMatrix();fasteners.setMatrixAt(n++,dummy.matrix);}tile.add(fasteners);bolts+=n;
 });
 const update=world.update;world.update=(...args)=>{update(...args);world.tiles.forEach(tile=>tile.children.forEach(m=>{if(m.userData.supersededRail9)m.visible=false}));};const details=world.details;world.details=()=>({...details(),roadsideCraft:{corrugatedSteelBeams:beams,structuralPosts:posts,hexFasteners:bolts,photographicShoulders:true}});return world;
}
