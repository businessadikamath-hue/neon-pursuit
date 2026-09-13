import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {vehicles,specs} from './vehiclePhysics.js';
import {blenderVehicleBodies as blenderCarBodies} from './blenderVehicleBodiesV8.js';
import {attachVehicleDetailTier} from './vehicleDetailTier.js';
import {fittedCanopy} from './vehicleCanopyV9.js';
import {installHyperVehicleDetail10} from './hyperDetail10.js';
const rubber=new T.MeshStandardMaterial({color:0x0d1012,roughness:.89});
const trim=new T.MeshStandardMaterial({color:0x101417,metalness:.12,roughness:.45});
const alloy=new T.MeshStandardMaterial({color:0x90979d,metalness:1,roughness:.31});
const darkAlloy=new T.MeshStandardMaterial({color:0x2d353b,metalness:.92,roughness:.31});
const brakeMetal=new T.MeshStandardMaterial({color:0x7a8389,metalness:.88,roughness:.43});
const seam=new T.MeshStandardMaterial({color:0x080c0e,metalness:0,roughness:.72});
const interior=new T.MeshStandardMaterial({color:0x192127,roughness:.88});
const caliperMat=new T.MeshStandardMaterial({color:0xaa3422,metalness:.45,roughness:.35});
const glass=new T.MeshPhysicalMaterial({color:0x406572,metalness:0,roughness:.028,ior:1.52,specularIntensity:1,clearcoat:.24,clearcoatRoughness:.028,envMapIntensity:1.28,transmission:.16,thickness:.012,transparent:true,opacity:.62,depthWrite:false});
const lampRed=new T.MeshStandardMaterial({color:0xdb1124,emissive:0xff1122,emissiveIntensity:.75,toneMapped:true});
const lampWhite=new T.MeshStandardMaterial({color:0xe2f8ff,emissive:0xc5e9ff,emissiveIntensity:.65,toneMapped:true});
const lampAmber=new T.MeshStandardMaterial({color:0xd89527,emissive:0xc77312,emissiveIntensity:.3});
const lens=new T.MeshPhysicalMaterial({color:0x071117,metalness:.34,roughness:.09,clearcoat:1,side:T.DoubleSide});
const smokedCover=new T.MeshPhysicalMaterial({color:0x789498,metalness:0,roughness:.08,transparent:true,opacity:.40,depthWrite:false,clearcoat:1,side:T.DoubleSide});
// Original microscopic weave and flake patterns. No external art or logo assets.
const weaveData=new Uint8Array(64*64*4),flakeData=new Uint8Array(64*64*4);
for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,c=((x>>2)+(y>>2))%2?137:109,n=Math.sin(x*127.1+y*311.7)*43758.5453,f=245+Math.floor((n-Math.floor(n))*10);weaveData.set([c,c,c,255],i);flakeData.set([f,f,f,255],i)}
function dataTexture(data,repeat,size=64){const t=new T.DataTexture(data,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;}
const weave=dataTexture(weaveData,7),flakes=dataTexture(flakeData,15);trim.bumpMap=weave;trim.bumpScale=.00035;
// Original microscopic surface maps; no photographic textures or imported models.
const microSize=128,microData=new Uint8Array(microSize*microSize*4),roughData=new Uint8Array(microSize*microSize*4),tireData=new Uint8Array(microSize*microSize*4);
for(let y=0;y<microSize;y++)for(let x=0;x<microSize;x++){const i=(y*microSize+x)*4,a=Math.sin(x*2.91+y*1.77),b=Math.cos(x*1.37-y*2.43),c=222+Math.round(a*14);microData.set([128+Math.round(a*25),128+Math.round(b*25),252,255],i);roughData.set([c,c,c,255],i);tireData.set([128+Math.round(a*42),128+Math.round(b*42),245,255],i);}
const microNormal=dataTexture(microData,19,microSize),paintRoughness=dataTexture(roughData,11,microSize),tireNormal=dataTexture(tireData,12,microSize);rubber.normalMap=tireNormal;rubber.normalScale=new T.Vector2(.055,.055);rubber.roughnessMap=paintRoughness;glass.normalMap=microNormal;glass.normalScale=new T.Vector2(.0015,.0015);
export function box(g,w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d,1,1,d>20?Math.ceil(d/4):1),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function rounded(g,w,h,d,x,y,z,mat,r=.016){const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function ellipsoid(g,rx,ry,rz,x,y,z,mat,detail=16){const m=new T.Mesh(new T.SphereGeometry(1,detail,10),mat);m.scale.set(rx,ry,rz);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function line(g,points,r,mat){const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(c,Math.max(8,points.length*5),r,4,false),mat);m.castShadow=true;g.add(m);return m;}
function quad(g,points,mat){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setIndex([0,2,1,0,3,2]);geo.computeVertexNormals();const m=new T.Mesh(geo,mat);g.add(m);return m;}
function rod(g,a,b,r,mat){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa),m=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),mat);m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());m.castShadow=true;g.add(m);return m;}
// Smooth longitudinal loft with individually rounded shoulders and underside.
function loft(g,sections,mat){
 const rings=[];for(let i=0;i<sections.length-1;i++)for(let k=0;k<4;k++){const u=k/4,a=sections[Math.max(0,i-1)],b=sections[i],c=sections[i+1],d=sections[Math.min(sections.length-1,i+2)];rings.push(b.map((v,j)=>j===0?v+(c[j]-v)*u:.5*((2*v)+(-a[j]+c[j])*u+(2*a[j]-5*v+4*c[j]-d[j])*u*u+(-a[j]+3*v-3*c[j]+d[j])*u*u*u)));}rings.push(sections.at(-1));
 const pos=[],uv=[],idx=[],n=24;
 for(let i=0;i<rings.length;i++){const [z,w,b,y,t,tw]=rings[i],corners=[[-w*.91,b],[w*.91,b],[w,y],[tw,t],[-tw,t],[-w,y]];
  for(let j=0;j<6;j++){const prev=corners[(j+5)%6],c=corners[j],next=corners[(j+1)%6],a=[c[0]*.80+prev[0]*.20,c[1]*.80+prev[1]*.20],b=[c[0]*.80+next[0]*.20,c[1]*.80+next[1]*.20];for(let k=0;k<4;k++){const f=k/4;pos.push((1-f)**2*a[0]+2*f*(1-f)*c[0]+f*f*b[0],(1-f)**2*a[1]+2*f*(1-f)*c[1]+f*f*b[1],z);uv.push((j*4+k)/n,i/(rings.length-1));}}
 }
 for(let k=0;k<rings.length-1;k++)for(let j=0;j<n;j++){const a=k*n+j,b=k*n+(j+1)%n;idx.push(a,b,a+n,b,b+n,a+n)}
 // Separate planar cap vertices prevent the fan triangulation from pulling the
 // bumper normals diagonally across the paint at the front and rear of a loft.
 for(const rear of [false,true]){const source=(rear?rings.length-1:0)*n,base=pos.length/3;let cy=0;for(let j=0;j<n;j++)cy+=pos[(source+j)*3+1]/n;pos.push(0,cy,rings[rear?rings.length-1:0][0]);uv.push(.5,.5);for(let j=0;j<n;j++){pos.push(...pos.slice((source+j)*3,(source+j)*3+3));uv.push(j/n,rear?1:0);}for(let j=0;j<n;j++){const a=base+1+j,b=base+1+(j+1)%n;idx.push(base,rear?a:b,rear?b:a);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
const groundTextures=new Map();
function contactShadow(g,w,l){const key=w+':'+l;if(!groundTextures.has(key)){const size=128,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const xx=(x/(size-1)-.5)*w*1.24,zz=(y/(size-1)-.5)*l*1.16;let alpha=112*Math.exp(-((xx/(w*.40))**4)-((zz/(l*.43))**4));for(const wheel of g.userData.wheels)alpha=Math.max(alpha,185*Math.exp(-(((xx-wheel.position.x)/.145)**2)-(((zz-wheel.position.z)/.245)**2)));const i=(y*size+x)*4;data.set([0,0,0,Math.round(alpha)],i);}groundTextures.set(key,dataTexture(data,1,size));}const mat=new T.MeshBasicMaterial({map:groundTextures.get(key),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});const m=new T.Mesh(new T.PlaneGeometry(w*1.24,l*1.16),mat);m.rotation.x=-Math.PI/2;m.position.y=.024;g.add(m);g.userData.ownedMaterials.push(mat);}
let carBatching=true;
// Internal QA control: applies only to newly constructed models, never UI settings.
export function setCarBatching(enabled){carBatching=!!enabled;}
function batchStatic(g){
 if(!carBatching)return;
 const batches=new Map();for(const m of [...g.children])if(m.isMesh&&!Array.isArray(m.material)){m.updateMatrix();const geo=m.geometry.clone().applyMatrix4(m.matrix);if(!geo.getAttribute('uv'))geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));if(!geo.index)geo.setIndex(Array.from({length:geo.getAttribute('position').count},(_,i)=>i));const key=m.material.uuid+':'+m.castShadow+':'+m.receiveShadow,batch=batches.get(key)||{material:m.material,cast:m.castShadow,receive:m.receiveShadow,geometries:[]};batch.geometries.push(geo);batches.set(key,batch);g.remove(m);m.geometry.dispose();}
 for(const {material,cast,receive,geometries} of batches.values()){const geo=mergeGeometries(geometries,false);for(const part of geometries)part.dispose();if(!geo)throw new Error('Car geometry batching failed');const mesh=new T.Mesh(geo,material);mesh.castShadow=cast;mesh.receiveShadow=receive;g.add(mesh);}
}
const decodedBodies=new Map();
function bodyMesh(g,id,paint){
 if(!decodedBodies.has(id)){const source=blenderCarBodies[id],decode=(s,Type)=>new Type(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer);decodedBodies.set(id,{position:Float32Array.from(decode(source.position,Int16Array),x=>x/10000),normal:Float32Array.from(decode(source.normal,Int16Array),x=>x/32767),uv:decode(source.uv,Float32Array),index:decode(source.index,Uint16Array)});}
 const data=decodedBodies.get(id),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(data.position,3));geometry.setAttribute('normal',new T.BufferAttribute(data.normal,3));geometry.setAttribute('uv',new T.BufferAttribute(data.uv,2));geometry.setIndex(new T.BufferAttribute(data.index,1));geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,paint);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);g.userData.bodySource='Original Blender continuous-surface body v9';g.userData.bodyTriangles=blenderCarBodies[id].triangleCount;
 for(const points of blenderCarBodies[id].panelSeams??[]){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),panel=new T.Mesh(new T.TubeGeometry(curve,points.length-1,.0015,4,false),seam);g.add(panel);}
}
function wheel(g,x,z,r=.38,detail=true,offroad=false,style='traffic'){
 const assembly=new T.Group();assembly.position.set(x,r,z);g.add(assembly);const count=detail?40:24,profile=[[r*.70,-.125],[r*.82,-.140],[r*.94,-.132],[r*.99,-.099],[r,-.065],[r,.065],[r*.99,.099],[r*.94,.132],[r*.82,.140],[r*.70,.125],[r*.70,-.125]],tire=new T.Mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),count),rubber);tire.rotation.z=Math.PI/2;tire.castShadow=true;assembly.add(tire);
 const side=Math.sign(x),outer=side*.145;
 for(const face of [-1,1]){const lip=new T.Mesh(new T.TorusGeometry(r*.85,.007,6,count),rubber);lip.rotation.y=Math.PI/2;lip.position.x=face*.142;assembly.add(lip)}
 const rim=new T.Mesh(new T.CylinderGeometry(r*.72,r*.72,.23,count,1,true),darkAlloy);rim.rotation.z=Math.PI/2;rim.position.x=side*.015;assembly.add(rim);
 const ring=new T.Mesh(new T.TorusGeometry(r*.72,.018,6,count),alloy);ring.rotation.y=Math.PI/2;ring.position.x=outer+side*.013;assembly.add(ring);
 const disc=new T.Mesh(new T.CylinderGeometry(r*.55,r*.55,.013,32),brakeMetal);disc.rotation.z=Math.PI/2;disc.position.x=outer-side*.055;assembly.add(disc);
 const spokes=offroad?6:style==='roadster'?8:['black','red','muscle','electric'].includes(style)?5:detail?10:5,split=style==='black'||style==='red',spokeMat=style==='rally'||style==='red'?darkAlloy:alloy;
 for(let a=0;a<spokes;a++)for(const shift of split?[-.075,.075]:[0]){const angle=a*Math.PI*2/spokes+shift;const spoke=rounded(assembly,.024,r*.61,style==='electric'?.10:style==='muscle'?.061:.026,outer+side*.022,Math.sin(angle)*r*.32,Math.cos(angle)*r*.32,spokeMat,.005);spoke.rotation.x=Math.PI/2-angle+(style==='electric'?.17:0);}
 const hub=new T.Mesh(new T.CylinderGeometry(.062,.062,.035,12),darkAlloy);hub.rotation.z=Math.PI/2;hub.position.x=outer+side*.029;assembly.add(hub);
 if(detail){for(let n=0;n<5;n++){const a=n*Math.PI*2/5;ellipsoid(assembly,.012,.012,.012,outer+side*.05,Math.sin(a)*.04,Math.cos(a)*.04,alloy,8)}for(let n=0;n<16;n++){const a=n*Math.PI/8,hole=new T.Mesh(new T.CircleGeometry(.0075,7),trim);hole.rotation.y=side*Math.PI/2;hole.position.set(outer-side*.046,Math.sin(a)*r*.45,Math.cos(a)*r*.45);assembly.add(hole);}rounded(g,.045,.17,.075,x+outer-side*.070,r+.06,z+.15,caliperMat,.012);}
 if(offroad&&detail)for(let n=0;n<24;n++){const a=n*Math.PI/12,m=box(assembly,.24,.042,.087,0,Math.sin(a)*r,Math.cos(a)*r,rubber);m.rotation.x=-a;}
 assembly.userData.radius=r;batchStatic(assembly);return assembly;
}
export const carDefs={black:{name:'Blackline R',color:0x080c11,width:2.16,length:4.6,top:245,steer:1,damage:24},silver:{name:'Ghost GT',color:0xacb7bd,width:2.06,length:4.85,top:232,steer:1.08,damage:21},red:{name:'Koenigsegg Jesko Attack',color:0xbf362b,width:2.03,length:4.626,top:252,steer:.95,damage:26},rally:{name:'Switchback RX',color:0x2676a2,width:1.88,length:3.85,damage:19},muscle:{name:'Iron V8',color:0x4d456f,width:2.12,length:5.15,damage:22},roadster:{name:'Aero S',color:0xceb16a,width:1.80,length:3.95,damage:30},electric:{name:'Vector E',color:0xc8dcde,width:2.10,length:5.0,damage:23},safari:{name:'Outrider 4',color:0x658378,width:2.18,length:4.7,damage:15}};
for(const [key,v] of Object.entries(vehicles))Object.assign(carDefs[key],v,{name:v.analogue.replace(' (200 mph hardware)',''),spec:specs(v),steer:1});
const profiles={
 black:{height:1.23,waist:.66,axles:[-1.42,1.44],radius:.37,body:[[-1,.69,.21,.40,.44,.47],[-.88,.93,.19,.55,.59,.70],[-.62,1,.20,.66,.71,.72],[-.27,.89,.20,.62,.67,.64],[.30,.97,.22,.70,.76,.72],[.64,1,.23,.75,.83,.74],[1,.87,.27,.69,.74,.70]],cabin:[[-.91,.58,.65,.69,.74,.48],[-.25,.61,.69,1.10,1.23,.47],[.50,.61,.72,1.09,1.23,.48],[1.12,.60,.74,.78,.86,.50]],roof:[-.20,.58,1.235,.90]},
 silver:{height:1.34,waist:.73,axles:[-1.53,1.45],radius:.39,body:[[-1,.78,.25,.57,.63,.64],[-.89,.97,.23,.69,.74,.75],[-.63,1,.24,.76,.82,.75],[-.19,.93,.23,.74,.81,.72],[.48,1,.25,.77,.82,.77],[.78,.99,.28,.76,.80,.75],[1,.87,.30,.70,.75,.71]],cabin:[[-.48,.67,.73,.79,.86,.56],[.02,.66,.78,1.22,1.34,.54],[.79,.67,.79,1.22,1.34,.55],[1.58,.70,.78,.79,.84,.59]],roof:[.06,.82,1.348,1.06]},
 red:{height:1.21,waist:.70,axles:[-1.35,1.35],radius:.36,body:[[-1,.76,.19,.37,.42,.56],[-.84,.96,.18,.51,.58,.72],[-.63,1,.20,.66,.72,.74],[-.26,.86,.21,.61,.64,.66],[.26,.95,.21,.66,.74,.70],[.62,1,.22,.76,.82,.77],[1,.91,.27,.66,.72,.67]],cabin:[[-.92,.60,.64,.67,.72,.49],[-.30,.60,.69,1.03,1.21,.45],[.45,.61,.72,1.04,1.21,.48],[1.02,.64,.73,.78,.83,.50]],roof:[-.25,.48,1.22,.89]},
 rally:{height:1.54,waist:.83,axles:[-1.23,1.19],radius:.36,body:[[-1,.83,.26,.62,.68,.65],[-.80,1,.23,.80,.84,.78],[-.40,.98,.24,.83,.87,.78],[.70,1,.26,.86,.9,.78],[1,.87,.29,.80,.84,.73]],cabin:[[-.71,.70,.84,.89,.93,.57],[-.32,.69,.85,1.42,1.54,.56],[1.17,.69,.87,1.43,1.54,.57],[1.57,.71,.85,1.19,1.26,.63]],roof:[-.28,1.20,1.55,1.10]},
 muscle:{height:1.37,waist:.74,axles:[-1.57,1.57],radius:.395,body:[[-1,.80,.25,.60,.66,.67],[-.88,.96,.23,.74,.79,.76],[-.60,1,.24,.80,.85,.77],[-.14,.93,.25,.74,.78,.73],[.48,1,.27,.80,.84,.77],[.82,.98,.29,.77,.82,.77],[1,.89,.30,.73,.77,.72]],cabin:[[-.49,.71,.74,.83,.89,.59],[.04,.68,.80,1.24,1.37,.56],[.91,.69,.80,1.24,1.37,.57],[1.80,.74,.79,.83,.89,.64]],roof:[.05,.93,1.382,1.11]},
 roadster:{height:1.21,waist:.68,axles:[-1.21,1.21],radius:.345,body:[[-1,.64,.23,.40,.45,.48],[-.86,.88,.22,.58,.64,.62],[-.62,1,.24,.68,.74,.65],[-.27,.94,.24,.65,.7,.66],[.38,.96,.24,.67,.71,.66],[.65,1,.25,.72,.77,.68],[1,.82,.29,.59,.66,.60]],cabin:null},
 electric:{height:1.43,waist:.73,axles:[-1.55,1.53],radius:.395,body:[[-1,.75,.23,.49,.56,.62],[-.86,.93,.23,.64,.70,.73],[-.63,1,.24,.75,.80,.77],[-.26,.96,.23,.72,.77,.74],[.52,1,.25,.76,.80,.76],[.82,.96,.29,.75,.79,.76],[1,.83,.33,.68,.73,.68]],cabin:[[-1.14,.73,.74,.79,.84,.61],[-.51,.73,.76,1.22,1.38,.60],[.25,.73,.77,1.30,1.44,.61],[.91,.74,.77,1.19,1.34,.63],[1.89,.76,.75,.79,.86,.65]],roof:null},
 safari:{height:2.03,waist:1.09,axles:[-1.44,1.49],radius:.475,body:[[-1,.86,.34,.95,1.01,.75],[-.87,.99,.31,1.08,1.13,.86],[-.52,1,.31,1.10,1.14,.86],[.83,1,.33,1.10,1.14,.86],[1,.94,.36,1.01,1.07,.84]],cabin:[[-.72,.84,1.07,1.15,1.20,.74],[-.39,.84,1.08,1.94,2.03,.74],[1.76,.86,1.10,1.94,2.03,.76],[2.13,.85,1.10,1.79,1.85,.75]],roof:[-.36,1.89,2.044,1.55]}
};
export {profiles as carBodyProfiles};
function painted(def){return new T.MeshPhysicalMaterial({color:def.id==='black'?0x111b22:def.color,metalness:def.id==='safari'?.18:.34,roughness:def.id==='safari'?.34:.22,clearcoat:1,clearcoatRoughness:.065,envMapIntensity:1.48,map:flakes,normalMap:microNormal,normalScale:new T.Vector2(.0065,.0065),roughnessMap:paintRoughness});}
function cabinSection(sections,z){let i=0;while(i<sections.length-2&&sections[i+1][0]<z)i++;const a=sections[Math.max(0,i-1)],b=sections[i],c=sections[i+1],d=sections[Math.min(sections.length-1,i+2)],u=Math.max(0,Math.min(1,(z-b[0])/(c[0]-b[0])));return b.map((v,j)=>j===0?z:.5*((2*v)+(-a[j]+c[j])*u+(2*a[j]-5*v+4*c[j]-d[j])*u*u+(-a[j]+3*v-3*c[j]+d[j])*u*u*u));}
function canopy(g,p,paint){if(!p.cabin)return;const a=p.cabin[0],b=p.cabin[1],c=p.cabin.at(-2),d=p.cabin.at(-1),base=Math.min(a[2],d[2])+.025,cabinWidth=Math.min(a[1],b[1])*1.66;
 box(g,cabinWidth,.035,Math.max(.25,d[0]-a[0]-.15),0,base,(a[0]+d[0])/2,interior);rounded(g,cabinWidth*.96,.12,.22,0,base+.09,a[0]+.15,interior,.025);
 for(const side of [-1,1]){const seatX=side*cabinWidth*.245,seatZ=Math.min(c[0]-.15,b[0]+.56),headY=Math.min(base+.49,Math.min(b[4],c[4])-.12),seatHeight=headY-base;ellipsoid(g,.18,Math.min(.235,seatHeight*.47),.105,seatX,base+seatHeight*.52,seatZ,interior,12);ellipsoid(g,.185,.065,.22,seatX,base+.065,seatZ-.13,interior,12);ellipsoid(g,.082,.093,.062,seatX,headY,seatZ,interior,10);}
 if(c[0]-b[0]>1.25)rounded(g,cabinWidth*.90,.31,.20,0,base+.17,c[0]-.16,interior,.04);
 fittedCanopy(g,p,paint,glass,trim,cabinSection);}

function finishBody(g,def,p,paint){
 const w=def.width/2,L=def.length/2;for(const side of [-1,1]){box(g,.065,.067,L*1.16,side*(w-.075),.27,.04,trim);const mirrorZ=def.id==='silver'||def.id==='muscle'?-.14:-.51;rod(g,[side*w*.72,p.waist+.13,mirrorZ],[side*(w-.075),p.waist+.20,mirrorZ],.018,trim);ellipsoid(g,.105,.052,.13,side*(w-.09),p.waist+.21,mirrorZ,paint);box(g,.009,.064,.10,side*(w-.19),p.waist+.21,mirrorZ+.065,glass);
  const doorBack=def.id==='safari'?.45:def.id==='rally'?.92:.76;box(g,.018,.024,.145,side*w*.964,p.waist-.03,doorBack-.12,alloy);
  if(def.id==='safari'||def.id==='rally')for(const z of p.axles){const arch=new T.Mesh(new T.TorusGeometry(p.radius+.05,.016,8,48,Math.PI),trim);arch.rotation.y=Math.PI/2;arch.position.set(side*(w-.025),p.radius,z);arch.castShadow=true;g.add(arch)}
 }
 box(g,w*1.76,.042,.21,0,.245,-L+.075,trim);box(g,w*1.7,.08,.26,0,.27,L-.13,trim);
 for(let i=0;i<5;i++)box(g,.022,.12,.3,-w*.58+i*w*.29,.29,L-.17,trim);
 const plate=new T.MeshStandardMaterial({color:0xe0e5df,roughness:.65});g.userData.ownedMaterials.push(plate);box(g,.36,.105,.008,0,def.id==='safari'?.79:.48,L-.008,plate);
}
function grille(g,w,h,y,z,rows=6){const direction=z<0?1:-1;rounded(g,w,h,.026,0,y,z+direction*.044,trim,.012);for(let i=0;i<rows;i++)rounded(g,w*.94,.011,.021,0,y-h*.40+i*h*.80/(rows-1),z+direction*.020,darkAlloy,.003);}
function exhaust(g,x,y,z,r=.066){const m=new T.Mesh(new T.CylinderGeometry(r,r,.1,18,1,true),alloy);m.rotation.x=Math.PI/2;m.position.set(x,y,z-.045);g.add(m);const hole=new T.Mesh(new T.CircleGeometry(r*.79,18),rubber);hole.position.set(x,y,z+.007);g.add(hole);}
function precisionDetails(g,def,p,paint){
 const id=def.id,w=def.width/2,L=def.length/2;
 const rear={black:[1.51,.53,.19],silver:[.55,.49,.13],red:[1.57,.53,.19],rally:[.53,.51,.13],muscle:[1.59,.61,.20],roadster:[.46,.47,.12],electric:[.56,.48,.13],safari:[.50,.72,.13]}[id];box(g,rear[0],rear[2],.018,0,rear[1],L-.035,trim);
 if(id==='black'||id==='red')for(let n=0;n<5;n++)box(g,rear[0]*.96,.010,.022,0,rear[1]-.068+n*.034,L-.018,darkAlloy);
 if(id!=='muscle'){box(g,.34,.086,.014,0,id==='safari'?.72:id==='black'||id==='red'?.36:rear[1],L-.012,alloy);for(const x of [-.135,.135])ellipsoid(g,.006,.006,.008,x,id==='safari'?.745:id==='black'||id==='red'?.386:rear[1]+.025,L+.001,darkAlloy,8);}
 box(g,w*1.66,.07,.13,0,.30,L-.002,trim);for(const side of [-1,1])box(g,.18,.025,.025,side*w*.70,.355,L+.024,lampRed);
 const lenses={black:[[.42,.505,.04],[.80,.56,.16],[.81,.685,.47],[.61,.645,.38]],red:[[.39,.47,.05],[.89,.57,.31],[.79,.67,.55],[.54,.59,.39]],silver:[[.48,.645,.025],[.80,.68,.10],[.87,.775,.47],[.63,.78,.47]],rally:[[.40,.70,.025],[.78,.74,.06],[.85,.865,.30],[.52,.86,.28]],roadster:[[.41,.50,.05],[.73,.565,.17],[.76,.695,.38],[.57,.68,.32]],electric:[[.43,.58,.045],[.78,.635,.10],[.85,.76,.45],[.64,.745,.43]]};
 if(lenses[id])for(const side of [-1,1]){const points=lenses[id].map(([x,y,z])=>[x*side,y,z-L]);quad(g,points,lens);line(g,[...points,points[0]],.006,trim);const [a,b,c,d]=points;line(g,[[a[0],a[1]+.009,a[2]-.003],[b[0],b[1]+.009,b[2]-.004],[b[0]*.65+c[0]*.35,b[1]*.65+c[1]*.35+.009,b[2]*.65+c[2]*.35-.004]],.012,lampWhite);for(let n=0;n<2;n++){const f=.42+n*.19;ellipsoid(g,.037,.013,.035,a[0]*(1-f)+c[0]*f,a[1]*(1-f)+c[1]*f+.018,a[2]*(1-f)+c[2]*f,lampWhite,10);}}
 if(p.cabin){const a=p.cabin[0],b=p.cabin[1],z=a[0]+.095,y=a[4]+.025+(b[4]-a[4])*.095/(b[0]-a[0]);for(const side of [-1,1]){rod(g,[side*.055,y,z],[side*.41,y+.025,z+.032],.009,trim);rod(g,[side*.22,y+.022,z+.032],[side*.49,y+.035,z+.039],.011,rubber);}}
 // Deep wheel wells and sidewall ribs sit behind the modeled body recesses.
 for(const side of [-1,1])for(const z of p.axles){const well=new T.Mesh(new T.TorusGeometry(p.radius+.037,.036,8,40,Math.PI),rubber);well.rotation.y=Math.PI/2;well.position.set(side*(w-.27),p.radius,z);g.add(well);}
 if(id!=='safari'){const fuel=new T.Mesh(new T.TorusGeometry(id==='electric'?.065:.075,.004,5,20),seam);fuel.rotation.y=Math.PI/2;fuel.position.set(w*.985,p.waist-.015,L*.54);g.add(fuel);}
 if(id==='black'){
  for(const side of [-1,1]){quad(g,[[side*.57,.30,-L+.015],[side*.91,.33,-L+.035],[side*.87,.445,-L+.03],[side*.58,.44,-L+.016]],trim);rod(g,[side*.56,.28,-L+.03],[side*.87,.29,-L+.055],.011,darkAlloy);}
  box(g,.91,.032,.72,0,.841,1.53,trim);for(const side of [-1,1]){box(g,.22,.06,.39,side*.24,.87,1.55,darkAlloy);for(let n=0;n<5;n++)box(g,.23,.012,.027,side*.24,.906,1.40+n*.071,alloy);rod(g,[side*.43,.925,1.19],[-side*.35,.925,1.90],.014,alloy);}quad(g,[[-.48,.944,1.17],[.48,.944,1.17],[.45,.917,1.93],[-.45,.917,1.93]],smokedCover);
 }
 if(id==='red'){for(const side of [-1,1]){quad(g,[[side*.34,.295,-L+.014],[side*.93,.32,-L+.005],[side*.79,.45,-L+.032],[side*.51,.39,-L+.025]],trim);for(let n=0;n<3;n++)box(g,.19,.009,.022,side*.62,.762,-1.39+n*.07,trim);for(const z of [1.53,1.78])ellipsoid(g,.011,.011,.011,side*w*.966,1.40,z,alloy,8);}loft(g,[[.35,.14,1.165,1.20,1.27,.10],[.65,.17,1.14,1.235,1.28,.13],[.86,.11,1.04,1.13,1.17,.08]],trim);}
 if(id==='silver'){for(const side of [-1,1]){box(g,.29,.13,.025,side*.76,.43,-L-.01,trim);for(let n=0;n<3;n++)box(g,.23,.01,.022,side*.76,.397+n*.034,-L-.026,darkAlloy);box(g,.115,.014,.34,side*.53,.827,-1.36,trim);}line(g,[[-.47,.86,1.60],[0,.86,1.64],[.47,.86,1.60]],.0038,seam);}
 if(id==='rally'){for(const side of [-1,1]){ellipsoid(g,.055,.055,.022,side*.79,.42,-L-.03,lampWhite,12);for(const z of p.axles)box(g,.18,.15,.025,side*(w-.095),.265,z+.31,rubber);}rod(g,[0,1.29,1.58],[.37,1.28,1.59],.011,trim);box(g,.34,.025,.025,0,1.503,L-.16,lampRed);}
 if(id==='muscle'){for(const side of [-1,1]){box(g,.31,.12,.023,side*.77,.41,-L-.01,trim);for(let n=0;n<4;n++)box(g,.012,.085,.025,side*(.66+n*.065),.41,-L-.025,darkAlloy);}line(g,[[-.57,.895,1.79],[0,.90,1.84],[.57,.895,1.79]],.0045,seam);}
 if(id==='roadster'){rod(g,[-.48,1.01,-.40],[-.13,.99,-.43],.011,trim);const steeringWheel=new T.Mesh(new T.TorusGeometry(.125,.015,7,24),interior);steeringWheel.rotation.x=-.30;steeringWheel.position.set(-.31,.915,-.05);g.add(steeringWheel);rod(g,[-.31,.915,-.05],[-.31,.91,-.25],.022,trim);box(g,.026,.058,.032,0,.88,.13,alloy);box(g,.62,.09,.10,0,.80,-.23,interior);}
 if(id==='electric'){for(const side of [-1,1]){box(g,.11,.018,.007,side*.65,.55,L+.019,lampRed);box(g,.018,.01,.065,side*w*.974,.733,.53,trim);}line(g,[[-.63,.878,1.80],[0,.887,1.93],[.63,.878,1.80]],.004,seam);}
 if(id==='safari'){for(const side of [-1,1]){ellipsoid(g,.063,.063,.027,side*w*.61,.93,-L-.027,lampWhite,12);box(g,.12,.045,.14,side*.48,.53,-L+.017,alloy);for(const z of [.45,1.48]){box(g,.042,.061,.075,side*w*.99,.89,z,trim);box(g,.018,.025,.14,side*w*.995,1.04,z-.18,alloy);}}box(g,1.45,.145,.075,0,.48,-L-.013,trim);box(g,.65,.022,.028,0,1.92,L-.16,lampRed);rod(g,[-.54,1.54,L-.047],[-.10,1.61,L-.046],.011,trim);}
}
function lamps(g,def,p){const w=def.width/2,L=def.length/2,id=def.id;for(const side of [-1,1]){
 if(id==='safari'){box(g,.36,.29,.024,side*w*.61,.91,-L+.004,trim);const circle=new T.Mesh(new T.TorusGeometry(.105,.012,6,24),lampWhite);circle.position.set(side*w*.61,.93,-L-.014);g.add(circle);box(g,.13,.045,.025,side*w*.84,.83,-L-.017,lampAmber);for(let n=0;n<2;n++)box(g,.15,.17,.026,side*w*.72,1.06-n*.25,L+.012,lampRed);}
 else if(id==='muscle'){rounded(g,.39,.10,.025,side*w*.61,.615,-L-.009,trim,.009);for(let n=0;n<3;n++){box(g,.052,.043,.031,side*(w*.46+n*.13),.642,-L-.024,lampWhite);box(g,.055,.20,.03,side*(w*.44+n*.125),.63,L+.014,lampRed)}}
 else if(id==='roadster'){ellipsoid(g,.15,.047,.024,side*w*.60,.57,-L+.036,trim);box(g,.23,.025,.022,side*w*.61,.585,-L+.008,lampWhite);const ring=new T.Mesh(new T.TorusGeometry(.065,.014,6,20),lampRed);ring.position.set(side*w*.58,.60,L+.01);g.add(ring);box(g,.18,.025,.025,side*w*.76,.6,L+.01,lampRed);}
 else{const y=id==='rally'?.73:id==='silver'?.66:id==='electric'?.61:.49;box(g,.31,.072,.030,side*w*.61,y+.025,-L+.09,trim);line(g,[[side*w*.75,y+.036,-L+.069],[side*w*.60,y+.047,-L+.069],[side*w*.46,y+.030,-L+.069]],.011,lampWhite);const rearY=id==='rally'?.81:id==='silver'?.69:id==='electric'?.69:.66;line(g,[[side*w*.85,rearY-.035,L+.006],[side*w*.78,rearY+.03,L+.012],[side*w*.43,rearY+.027,L+.014]],.016,lampRed);}
 }}
function specialty(g,def,p,paint){const w=def.width/2,L=def.length/2,id=def.id;
 if(id==='black'||id==='red'){
  for(const side of [-1,1]){loft(g,[[.44,.06,.43,.50,.61,.04],[.95,.07,.43,.61,.69,.04],[1.32,.04,.43,.51,.59,.03]],trim).position.x=side*w*.885;}
  grille(g,1.28,.19,.42,L-.015,6);for(let n=0;n<9;n++)box(g,.88,.014,.025,0,.855,1.18+n*.071,trim);for(const side of [-1,1])exhaust(g,side*.23,id==='red'?.61:.47,L+.01,.071);
  if(id==='black'){box(g,1.71,.036,.17,0,.836,L-.22,paint);for(const side of [-1,1])box(g,.32,.12,.016,side*.72,.53,L-.017,trim);}
  else{for(const side of [-1,1]){rod(g,[side*.61,.81,1.55],[side*.61,1.39,1.65],.029,trim);box(g,.036,.20,.41,side*w*.94,1.40,1.66,paint)}loft(g,[[1.44,w*.94,1.36,1.40,1.43,w*.90],[1.67,w*.94,1.39,1.42,1.445,w*.9],[1.86,w*.94,1.40,1.435,1.45,w*.9]],trim);const shape=new T.Shape();shape.moveTo(.58,.80);shape.lineTo(.58,1.16);shape.lineTo(1.62,1.38);shape.lineTo(1.92,.82);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false});const fin=new T.Mesh(geo,paint);fin.rotation.y=-Math.PI/2;fin.position.x=.0125;fin.castShadow=true;g.add(fin);}
 }
 if(id==='silver'){grille(g,1.12,.25,.50,-L-.009,8);for(const side of [-1,1]){box(g,.018,.075,.44,side*w*.98,.69,-.87,trim);for(let n=0;n<3;n++)box(g,.024,.009,.39,side*w*.987,.668+n*.022,-.86,alloy);exhaust(g,side*.66,.40,L+.005,.065)}box(g,1.70,.035,.12,0,.80,L-.17,paint);}
 if(id==='rally'){grille(g,1.18,.27,.48,-L-.016,7);for(const side of [-1,1]){line(g,[[side*.705,.88,.55],[side*.705,1.43,.60],[side*.575,1.55,.60]],.027,paint);box(g,.20,.15,.031,side*w*.84,.4,-L-.013,trim);exhaust(g,side*.58,.39,L+.014,.069)}box(g,1.61,.038,.31,0,1.52,L-.31,trim);}
 if(id==='muscle'){grille(g,1.22,.18,.53,-L-.022,5);for(const side of [-1,1]){box(g,.16,.014,.42,side*.54,.837,-1.32,trim);exhaust(g,side*.69,.4,L+.02,.070);exhaust(g,side*.84,.4,L+.02,.060)}box(g,1.83,.045,.20,0,.85,L-.24,paint);}
 if(id==='roadster'){box(g,1.23,.055,1.13,0,.717,.29,interior);loft(g,[[-.59,.61,.70,.74,.76,.54],[-.27,.57,.75,1.11,1.20,.49],[-.22,.57,.75,1.10,1.20,.49]],glass);for(const side of [-1,1]){rod(g,[side*.61,.72,-.59],[side*.51,1.20,-.25],.022,paint);ellipsoid(g,.22,.24,.19,side*.30,.87,.58,interior);ellipsoid(g,.22,.08,.31,side*.30,.73,.32,interior);const hoop=new T.Mesh(new T.TorusGeometry(.14,.022,7,18,Math.PI),darkAlloy);hoop.position.set(side*.3,1.04,.80);g.add(hoop);}box(g,1.02,.028,.028,0,1.2,-.25,paint);box(g,.22,.12,.65,0,.77,.35,trim);grille(g,.76,.14,.38,-L+.022,5);exhaust(g,.52,.36,L,.055);}
 if(id==='electric'){grille(g,.8,.10,.36,-L+.023,4);for(const side of [-1,1]){line(g,[[side*.747,.794,.23],[side*.747,1.30,.25],[side*.617,1.445,.25]],.014,trim);line(g,[[side*w*.965,.72,.20],[side*w*.956,.37,.30]],.005,seam);box(g,.01,.023,.14,side*w*.97,.70,-.35,alloy)}line(g,[[-.74,.748,L-.015],[0,.77,L+.005],[.74,.748,L-.015]],.018,lampRed);box(g,1.66,.025,.11,0,.797,L-.12,paint);}
 if(id==='safari'){grille(g,.85,.25,.90,-L-.014,6);for(const side of [-1,1]){for(const z of [.32,1.06])line(g,[[side*.866,1.11,z],[side*.866,1.94,z],[side*.765,2.04,z]],z===.32?.040:.053,paint);box(g,.095,.16,2.0,side*.63,2.12,.72,trim);box(g,.075,.55,.026,side*.89,1.46,1.81,paint);line(g,[[side*w*.98,1.075,.43],[side*w*.98,.43,.44]],.008,seam);line(g,[[side*w*.98,1.075,1.48],[side*w*.98,.43,1.49]],.008,seam);box(g,.18,.026,.31,side*.66,1.157,-1.64,trim)}box(g,1.53,.025,1.82,0,2.19,.71,darkAlloy);for(let n=0;n<6;n++)box(g,1.45,.02,.055,0,2.213,-.04+n*.3,trim);const spare=new T.Mesh(new T.CylinderGeometry(.39,.39,.20,32),rubber);spare.rotation.x=Math.PI/2;spare.position.set(0,1.25,L-.04);spare.castShadow=true;g.add(spare);const cover=new T.Mesh(new T.CircleGeometry(.28,32),paint);cover.position.set(0,1.25,L+.065);g.add(cover);}
}
export function makePlayer(kind='black'){
 const def=carDefs[kind]??carDefs.black,p=profiles[def.id],g=new T.Group(),paint=painted(def);g.userData={wheels:[],def,kind:def.id,brakes:lampRed,ownedMaterials:[paint],artRevision:11};
 const w=def.width/2,L=def.length/2;bodyMesh(g,def.id,paint);canopy(g,p,paint);
 for(const side of [-1,1])for(const z of p.axles)g.userData.wheels.push(wheel(g,side*(w-.15),z,p.radius,true,def.id==='safari',def.id));
 finishBody(g,def,p,paint);lamps(g,def,p);specialty(g,def,p,paint);precisionDetails(g,def,p,paint);installHyperVehicleDetail10(g,{def,profile:p,hero:true});contactShadow(g,def.width,def.length);batchStatic(g);return attachVehicleDetailTier(g,{def,profile:p,paint,rubber,rotorMaterial:brakeMetal,caliperMaterial:caliperMat,trimMaterial:trim,batching:()=>carBatching});
}
export const trafficDefs=[['Saloon',1.85,4.5,1.43],['Hatchback',1.74,3.85,1.5],['Estate',1.90,4.9,1.5],['Compact SUV',1.98,4.55,1.80],['Family SUV',2.06,5.0,1.9],['Delivery van',2.02,5.15,2.35],['Pickup',2.05,5.25,1.85],['City car',1.64,3.5,1.52],['Taxi',1.86,4.65,1.52],['Minivan',2.02,4.98,1.91],['Coupe',1.88,4.45,1.30],['Utility wagon',1.86,4.6,1.75]];
export function makeTraffic(type=0,cop=false){
 type=Math.max(0,Math.min(trafficDefs.length-1,type));const [name,width,length,h]=trafficDefs[type],w=width/2,L=length/2,g=new T.Group(),palette=[0x9cabb0,0x779d87,0xb18663,0x648aa3,0x485561,0xd5dad5,0x947954,0xa5afb8,0xdfbe47,0x7d9886,0x944948,0xa6b1aa],paint=new T.MeshPhysicalMaterial({color:cop?0xd9e0e2:palette[type],metalness:.27,roughness:.29,clearcoat:1,clearcoatRoughness:.10,envMapIntensity:1.15});
 paint.map=flakes;paint.normalMap=microNormal;paint.normalScale=new T.Vector2(.006,.006);paint.roughnessMap=paintRoughness;
 const flash=[];g.userData={wheels:[],flash,name:cop?'Highway patrol':name,width,length,ownedMaterials:[paint],artRevision:11};
 const waistOffset=[3,4,9,11].includes(type)?.22:type===5?.10:type===6?.08:0;bodyMesh(g,'traffic'+type,paint);
 let cabin;
 if(type===5){loft(g,[[-L*.64,w*.82,.77,1.04,1.11,w*.7],[-L*.39,w*.82,.82,h-.12,h,w*.69],[L*.84,w*.86,.80,h-.11,h,w*.74],[L*.94,w*.86,.80,h-.15,h-.04,w*.74]],paint);quad(g,[[-w*.69,1.15,-L*.672],[w*.69,1.15,-L*.672],[w*.63,h-.23,-L*.46],[-w*.63,h-.23,-L*.46]],glass);for(const side of [-1,1]){box(g,.01,.63,.79,side*w*.835,1.57,-L*.24,glass);line(g,[[side*w*.87,.86,.3],[side*w*.87,2.15,.3],[side*w*.87,2.15,1.70]],.006,seam)}line(g,[[0,.71,L*.955],[0,h-.12,L*.955]],.007,seam);}
 else if(type===6){cabin=[[-1.26,w*.75,.81,.85,.93,w*.65],[-.72,w*.74,.84,h-.1,h,w*.61],[.27,w*.75,.84,h-.1,h,w*.63],[.58,w*.77,.84,1.03,1.10,w*.65]];canopy(g,{cabin,roof:[-.66,.26,h+.01,w*1.22]},paint);box(g,w*1.68,.10,L*.72,0,.91,L*.56,interior);for(const side of [-1,1])box(g,.09,.26,L*.73,side*w*.88,1.02,L*.56,paint);box(g,w*1.77,.28,.09,0,1.01,L-.05,paint);}
 else{const longRoof=[2,3,4,7,9,11].includes(type),front=type===9?-L*.68:-L*.47,rear=longRoof?L*.73:L*.40,back=longRoof?L*.85:L*.72;cabin=[[front,w*.76,.80+waistOffset,.85+waistOffset,.92+waistOffset,w*.63],[front+.44,w*.75,.82+waistOffset,h-.13,h,w*.61],[rear,w*.76,.84+waistOffset,h-.12,h,w*.63],[back,w*.79,.82+waistOffset,.93+waistOffset,1.0+waistOffset,w*.65]];canopy(g,{cabin,roof:[front+.48,rear,h+.01,w*1.25]},paint);for(const side of [-1,1])line(g,[[side*w*.774,.85+waistOffset,.23],[side*w*.774,h-.13,.23],[side*w*.634,h+.006,.23]],.024,paint);}
 const radius=[3,4,6,11].includes(type)?.39:.34;for(const side of [-1,1])for(const z of [-length*.31,length*.31])g.userData.wheels.push(wheel(g,side*(w-.14),z,radius,false));
 for(const side of [-1,1]){const frontY=.625+waistOffset*.65,rearY=.69+waistOffset*.60,mirrorZ=type===5?-L*.31:type===6?-.78:(cabin?.[0][0]??-.6)+.26,mirrorY=Math.min(h-.32,1.02+waistOffset*.65);rounded(g,.34,.115,.034,side*w*.64,frontY,-L-.002,lens,.012);for(let n=0;n<2;n++)ellipsoid(g,.032,.032,.014,side*(w*.59+n*.10),frontY+.008,-L-.024,lampWhite,10);rounded(g,.29,.012,.014,side*w*.64,frontY-.036,-L-.026,lampWhite,.003);rounded(g,.29,.135,.03,side*w*.68,rearY,L+.004,lens,.013);rounded(g,.24,.025,.018,side*w*.68,rearY+.037,L+.026,lampRed,.004);rounded(g,.24,.034,.018,side*w*.68,rearY-.031,L+.026,lampRed,.005);box(g,.043,.025,.019,side*w*.78,rearY+.001,L+.028,lampAmber);rod(g,[side*w*.76,mirrorY-.035,mirrorZ],[side*(w-.073),mirrorY,mirrorZ],.014,trim);ellipsoid(g,.09,.047,.12,side*(w-.065),mirrorY,mirrorZ,paint,10);box(g,.01,.050,.10,side*(w-.15),mirrorY,mirrorZ+.07,glass);box(g,.015,.025,.12,side*w*.97,.76+waistOffset,.49,alloy);rounded(g,.055,.06,L,side*w*.96,.29,.02,trim,.008);}
 grille(g,width*.47,.14,.45,-L-.013,4);rounded(g,.50,.14,.018,0,.49,L-.035,trim,.012);box(g,.34,.086,.014,0,.49,L-.016,alloy);for(const x of [-.13,.13])ellipsoid(g,.006,.006,.006,x,.517,L-.006,darkAlloy,8);rounded(g,width*.75,.057,.08,0,.30,L-.013,trim,.010);
 if(cabin){const a=cabin[0],b=cabin[1],z=a[0]+.08,y=a[4]+.024+(b[4]-a[4])*.08/(b[0]-a[0]);for(const side of [-1,1])rod(g,[side*.055,y,z],[side*.39,y+.022,z+.025],.009,trim);}
 if(type===5){for(const side of [-1,1]){for(const y of [1.12,1.85])rounded(g,.036,.12,.045,side*w*.79,y,L*.946,alloy,.006);rounded(g,.027,.026,.19,side*w*.873,1.25,.47,alloy,.006);}rounded(g,.055,.19,.02,-.13,1.21,L*.956,trim,.008);}
 if(type===6){for(let n=0;n<8;n++)rounded(g,.020,.014,L*.61,-w*.65+n*w*1.3/7,.968,L*.55,trim,.005);rounded(g,.30,.045,.025,0,1.045,L+.002,trim,.008);}
 if(type===8){const taxiMat=new T.MeshStandardMaterial({color:0xf3e1a0,roughness:.4});box(g,.43,.13,.23,0,h+.11,.07,taxiMat);g.userData.ownedMaterials.push(taxiMat)}
 if(type===11||type===4)for(const side of [-1,1])box(g,.037,.05,1.55,side*.56,h+.07,.4,trim);
 if(cop){box(g,width*.75,.035,.28,0,h+.04,.12,trim);for(const side of [-1,1]){const color=side<0?0xff1030:0x167cff,mat=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2});box(g,.34,.09,.20,side*.24,h+.105,.12,mat);flash.push(mat);g.userData.ownedMaterials.push(mat)}for(const side of [-1,1])box(g,.014,.16,1.55,side*w*.975,.66,.04,trim);}
 installHyperVehicleDetail10(g,{def:{id:'traffic'+type,width,length},profile:{cabin},hero:false});contactShadow(g,width,length);batchStatic(g);return attachVehicleDetailTier(g,{def:{id:'traffic'+type,width,length},profile:{cabin},paint,rubber,rotorMaterial:brakeMetal,caliperMaterial:caliperMat,trimMaterial:trim,batching:()=>carBatching,traffic:true,waistOffset,mirrorZ:type===5?-L*.31:type===6?-.78:(cabin?.[0][0]??-.6)+.26,mirrorY:Math.min(h-.32,1.02+waistOffset*.65)});
}

