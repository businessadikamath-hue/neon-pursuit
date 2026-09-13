import * as T from 'three';
import {box} from './models.js';
export const curve=s=>55*Math.sin(s/260)+22*Math.sin(s/115);
export const slopeX=s=>55/260*Math.cos(s/260)+22/115*Math.cos(s/115);
export const curvature=s=>-55/260**2*Math.sin(s/260)-22/115**2*Math.sin(s/115);
export const elevation=s=>7*Math.sin(s/190)+2.5*Math.sin(s/75);
export const grade=s=>7/190*Math.cos(s/190)+2.5/75*Math.cos(s/75);
let runLayout={seed:1,first:320,spacing:850};
const noise=n=>{let v=(n^0x9e3779b9)>>>0;v=Math.imul(v^(v>>>16),0x21f0aaad);v=Math.imul(v^(v>>>15),0x735a2d97);return ((v^(v>>>15))>>>0)/4294967296};
export function configureRoute(seed){runLayout={seed:seed>>>0,first:260+Math.floor(noise(seed)*240),spacing:780+Math.floor(noise(seed+31)*220)};return {...runLayout};}
export function junction(travel,time){let index=Math.max(0,Math.floor((travel-runLayout.first)/runLayout.spacing));const pos=i=>runLayout.first+i*runLayout.spacing+(i?Math.floor((noise(runLayout.seed+i*13)-.5)*130):0);while(pos(index)+30<travel)index++;while(index>0&&pos(index-1)+30>=travel)index--;const position=pos(index),phase=((time+noise(runLayout.seed+index*7)*24)%24+24)%24;return {id:index,position,ahead:position-travel,phase,state:phase<12?'GREEN':phase<15?'AMBER':'RED'};}

const glsl=`uniform float routeTravel;uniform float routeOriginX;uniform float routeOriginY;uniform float routeTangent;uniform float coastShore9;
float rx(float s){return 55.*sin(s/260.)+22.*sin(s/115.);}
float ry(float s){return 7.*sin(s/190.)+2.5*sin(s/75.);}
vec4 roadWarp(vec4 p){float ahead=-p.z;float shore9=smoothstep(24.,46.,-p.x)*coastShore9;p.x+=rx(routeTravel+ahead)-routeOriginX-routeTangent*ahead;p.y+=ry(routeTravel+ahead)*(1.-shore9)-routeOriginY;return p;}
`;
const bentNormal=`#include <defaultnormal_vertex>
 // Transform the normal with the inverse transpose of the road deformation.
 // Position-only bending leaves road/car highlights pointed at a flat surface.
 vec4 normalRoutePosition=vec4(position,1.0);
 #ifdef USE_INSTANCING
 normalRoutePosition=instanceMatrix*normalRoutePosition;
 #endif
 normalRoutePosition=modelMatrix*normalRoutePosition;
 float normalRouteS=routeTravel-normalRoutePosition.z;
 float bendX=routeTangent-(55./260.*cos(normalRouteS/260.)+22./115.*cos(normalRouteS/115.));
 float bendY=-(7./190.*cos(normalRouteS/190.)+2.5/75.*cos(normalRouteS/75.));
 vec3 roadWorldNormal=vec3(dot(viewMatrix[0].xyz,transformedNormal),dot(viewMatrix[1].xyz,transformedNormal),dot(viewMatrix[2].xyz,transformedNormal));
 float coastT9=clamp((-normalRoutePosition.x-24.)/22.,0.,1.);
 float coastWeight9=coastT9*coastT9*(3.-2.*coastT9)*coastShore9;
 float coastSlope9=-6.*coastT9*(1.-coastT9)/22.*coastShore9;
 roadWorldNormal.x+=ry(normalRouteS)*coastSlope9*roadWorldNormal.y;
 roadWorldNormal.z-=bendX*roadWorldNormal.x+bendY*(1.-coastWeight9)*roadWorldNormal.y;
 transformedNormal=mat3(viewMatrix)*roadWorldNormal;
 #ifdef USE_TANGENT
 vec3 roadWorldTangent=vec3(dot(viewMatrix[0].xyz,transformedTangent),dot(viewMatrix[1].xyz,transformedTangent),dot(viewMatrix[2].xyz,transformedTangent));
 roadWorldTangent.y+=bendY*(1.-coastWeight9)*roadWorldTangent.z-ry(normalRouteS)*coastSlope9*roadWorldTangent.x;
 roadWorldTangent.x+=bendX*roadWorldTangent.z;
 transformedTangent=mat3(viewMatrix)*roadWorldTangent;
 #endif
`;
const uniform={value:0},originX={value:0},originY={value:0},tangent={value:slopeX(0)},coastShore={value:0},patched=new WeakSet();
export function addRoute(world){
 function patch(material){if(patched.has(material))return;patched.add(material);const old=material.onBeforeCompile,priorKey=material.customProgramCacheKey();material.userData.preRouteCompile=old;material.userData.preRouteKey=priorKey;material.onBeforeCompile=shader=>{old?.(shader);shader.uniforms.routeTravel=uniform;shader.uniforms.routeOriginX=originX;shader.uniforms.routeOriginY=originY;shader.uniforms.routeTangent=tangent;shader.uniforms.coastShore9=coastShore;shader.vertexShader=glsl+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 routePosition=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 routePosition=instanceMatrix*routePosition;
 #endif
 vec4 mvPosition=viewMatrix*roadWarp(modelMatrix*routePosition);
 gl_Position=projectionMatrix*mvPosition;`);shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
 #if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
 worldPosition=roadWarp(worldPosition);
 #endif`);shader.vertexShader=shader.vertexShader.replace('#include <defaultnormal_vertex>',bentNormal)};material.customProgramCacheKey=()=> priorKey+':route-art-v9-coast-normals';material.needsUpdate=true;}
 const alphaDepths=new WeakMap();const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});patch(depth);
 world.bindRoute=object=>object.traverse(m=>{if(m.isMesh){for(const mat of Array.isArray(m.material)?m.material:[m.material]){if(!mat.isShaderMaterial)patch(mat)}const mat=Array.isArray(m.material)?m.material[0]:m.material;if((mat.alphaTest>0&&mat.map)||mat.userData.preRouteKey?.startsWith('treeArt-')){let cutout=alphaDepths.get(mat);if(!cutout){cutout=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:mat.alphaTest>0?mat.map:null,alphaMap:mat.alphaMap,alphaTest:mat.alphaTest,side:T.DoubleSide});if(mat.userData.preRouteKey?.startsWith('treeArt-')){cutout.onBeforeCompile=mat.userData.preRouteCompile;cutout.customProgramCacheKey=()=>mat.userData.preRouteKey+'-depth'}patch(cutout);alphaDepths.set(mat,cutout)}m.customDepthMaterial=cutout}else m.customDepthMaterial=depth;m.frustumCulled=false;}});
 const pole=new T.MeshStandardMaterial({color:0x646c72,metalness:.6,roughness:.5}),lights=[];
 const junctionGroup=new T.Group();junctionGroup.userData.gameOnlyKeep=true;world.scene.add(junctionGroup);world.junctionGroup=junctionGroup;
 function sign(parent,text,x,z){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#163d38';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#e5edd8';ctx.lineWidth=12;ctx.strokeRect(8,8,496,240);ctx.fillStyle='#edf3df';ctx.textAlign='center';ctx.font='bold 40px sans-serif';text.split('|').forEach((t,i)=>ctx.fillText(t,256,90+i*60));const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const g=new T.Group();g.userData.gameOnlyKeep=true;parent.add(g);box(g,.12,3,.12,x,1.5,z,pole);box(g,3.5,1.75,.08,x,3,z,new T.MeshStandardMaterial({map:tx,roughness:.8}));}
 world.tiles.forEach((tile,i)=>{tile.userData.routeBlock=i-1;sign(tile,i%2?'CURVES|KEEP YOUR LINE':'SCENIC ROUTE|STAY ALERT',-17,-25)});
 const cross=new T.Mesh(new T.PlaneGeometry(110,16,44,4),world.asphalt);cross.rotation.x=-Math.PI/2;cross.position.set(0,.035,0);cross.receiveShadow=true;junctionGroup.add(cross);
 for(const z of [-12,12])box(junctionGroup,23,.04,.4,0,.07,z,new T.MeshStandardMaterial({color:0xe8e3d0}));
 for(const side of [-1,1]){box(junctionGroup,.16,5,.16,side*12.9,2.5,10,pole);box(junctionGroup,8,.12,.12,side*9,4.95,10,pole);box(junctionGroup,.45,1.3,.28,side*6,4.55,10,new T.MeshStandardMaterial({color:0x171d20}));const lamp=[];for(let j=0;j<3;j++){const mat=new T.MeshStandardMaterial({color:0x0c1110,emissive:[0xfa2920,0xffc437,0x47ec9d][j],emissiveIntensity:.04}),m=new T.Mesh(new T.CircleGeometry(.15,14),mat);m.position.set(side*6,4.95-j*.4,10.16);junctionGroup.add(m);lamp.push(mat)}lights.push(lamp)}
 sign(junctionGroup,'JUNCTION|SIGNALS AHEAD',-17,75);sign(junctionGroup,'CROSS TRAFFIC|WATCH SIGNALS',18,30);
 world.tiles.forEach(world.bindRoute);world.bindRoute(junctionGroup);const oldUpdate=world.update;
 world.update=(distance,time,x)=>{const j=junction(distance,time);world.setJunctionClearance?.(distance,j.position);oldUpdate(distance,time,x);uniform.value=distance;originX.value=curve(distance);originY.value=elevation(distance);tangent.value=slopeX(distance);coastShore.value=world.biome==='coastline'?1:0;world.water.position.y=-3-elevation(distance);const ocean=world.ocean();if(ocean.water)ocean.water.position.y=world.water.position.y;if(ocean.foam)ocean.foam.position.y=world.water.position.y+.24;
 for(const tile of world.tiles){let block=tile.userData.routeBlock;while(distance-block*160>320)block+=5;while(distance-block*160< -640)block-=5;tile.userData.routeBlock=block;tile.position.z=distance-block*160;tile.visible=true;}junctionGroup.position.z=distance-j.position;junctionGroup.visible=j.ahead<630&&j.ahead>-50;lights.forEach(a=>a.forEach((m,i)=>m.emissiveIntensity=(i===(j.state==='RED'?0:j.state==='AMBER'?1:2))?3:.025));};
 world.routeInfo=()=>({curvature:curvature(uniform.value),grade:grade(uniform.value),elevation:elevation(uniform.value),centerline:curve(uniform.value),signal:world.signal,intersections:1,cycleMeters:runLayout.spacing,runLayout:{...runLayout}});return world;
}
