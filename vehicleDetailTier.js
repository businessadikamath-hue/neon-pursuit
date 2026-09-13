import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {heroVehicleParts} from './heroVehicleParts.js';

// Original, embedded Ultra+ parts and microtextures. This optional tier never
// changes the lower-tier assemblies and never adapts downward at runtime.
const decoded=new Map();
function partGeometry(name){
 if(!decoded.has(name)){const s=heroVehicleParts[name],decode=(text,Type)=>new Type(Uint8Array.from(atob(text),c=>c.charCodeAt(0)).buffer);decoded.set(name,{position:decode(s.position,Float32Array),normal:Float32Array.from(decode(s.normal,Int16Array),n=>n/32767),uv:decode(s.uv,Float32Array),index:decode(s.index,Uint32Array)});}
 const d=decoded.get(name),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(d.position,3));g.setAttribute('normal',new T.BufferAttribute(d.normal,3));g.setAttribute('uv',new T.BufferAttribute(d.uv,2));g.setIndex(new T.BufferAttribute(d.index,1));return g;
}
function texture(data,size){const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;}
const size=256,flakeData=new Uint8Array(size*size*4),normalData=new Uint8Array(size*size*4),roughData=new Uint8Array(size*size*4);
for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.sin(x*12.9898+y*78.233)*43758.5453,f=r-Math.floor(r),wave=Math.sin(x*.83+y*.43);flakeData.set([247+Math.round(f*8),247+Math.round(f*8),247+Math.round(f*8),255],i);normalData.set([128+Math.round((f-.5)*45),128+Math.round(wave*17),254,255],i);const c=225+Math.round(f*27);roughData.set([c,c,c,255],i);}
const paintFlake=texture(flakeData,size),paintNormal=texture(normalData,size),paintRough=texture(roughData,size);paintFlake.repeat.set(9,9);paintNormal.repeat.set(12,12);paintRough.repeat.set(9,9);
const glyphs={A:['01110','10001','10001','11111','10001','10001','10001'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['111','010','010','010','010','010','111'],L:['10000','10000','10000','10000','10000','10000','11111'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],V:['10001','10001','10001','10001','10001','01010','00100'],Y:['10001','10001','01010','00100','00100','00100','00100']};
const sidewallMaps=new Map();
function sidewallMap(label){if(!sidewallMaps.has(label)){const n=256,data=new Uint8Array(n*n*4);for(let i=0;i<data.length;i+=4)data.set([75,75,75,255],i);let cursor=16;for(const letter of label){const rows=glyphs[letter];if(rows)for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++)if(rows[y][x]==='1')for(let yy=0;yy<3;yy++)for(let xx=0;xx<2;xx++){const px=(cursor+x*2+xx)%n,py=115+y*3+yy,i=(py*n+px)*4;data.set([148,148,148,255],i);}cursor+=letter===' '?8:12;}const t=texture(data,n);t.repeat.set(1,1);sidewallMaps.set(label,t);}return sidewallMaps.get(label);}
function add(g,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function box(g,w,h,d,x,y,z,mat){return add(g,new T.BoxGeometry(w,h,d),mat,x,y,z);}
function ring(g,r,t,x,mat,segments=96){const m=add(g,new T.TorusGeometry(r,t,8,segments),mat,x);m.rotation.y=Math.PI/2;return m;}
function sphere(g,r,x,y,z,mat){return add(g,new T.SphereGeometry(r,10,7),mat,x,y,z);}
function rod(g,a,b,r,mat){const v=new T.Vector3(...a),delta=new T.Vector3(...b).sub(v),m=add(g,new T.CylinderGeometry(r,r,delta.length(),8),mat);m.position.copy(v.addScaledVector(delta,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
function batch(g){const groups=new Map();for(const m of [...g.children])if(m.isMesh){m.updateMatrix();const geom=m.geometry.clone().applyMatrix4(m.matrix);if(!geom.attributes.uv)geom.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geom.attributes.position.count*2),2));if(!geom.index)geom.setIndex(Array.from({length:geom.attributes.position.count},(_,i)=>i));const key=m.material.uuid+':'+m.castShadow+':'+m.receiveShadow,group=groups.get(key)||{mat:m.material,cast:m.castShadow,receive:m.receiveShadow,parts:[]};group.parts.push(geom);groups.set(key,group);g.remove(m);m.geometry.dispose();}for(const v of groups.values()){const geometry=mergeGeometries(v.parts,false);v.parts.forEach(g=>g.dispose());if(!geometry)throw new Error('Ultra+ car batching failed');const m=add(g,geometry,v.mat);m.castShadow=v.cast;m.receiveShadow=v.receive;}}
function annularSidewall(g,r,x,mat,side){const segments=128,positions=[],uv=[],indices=[];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;for(const radius of [r*.775,r*.89]){positions.push(x,Math.sin(a)*radius,Math.cos(a)*radius);uv.push(i/segments,radius===r*.775?0:1);}}for(let i=0;i<segments;i++){const a=i*2;if(side>0)indices.push(a,a+1,a+2,a+1,a+3,a+2);else indices.push(a,a+2,a+1,a+1,a+2,a+3);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return add(g,geo,mat);}

export function attachVehicleDetailTier(root,context){
 const state={quality:'baseline',built:false,active:false,meshCount:0,triangleCount:0,rotatingGroups:0,source:'Original Blender parts and procedural detail v9 Ultra+'};root.userData.vehicleDetailTier=state;
 let parts=[],replacements=[],paintMeshes=[],heroPaint=null;
 const build=()=>{
  if(state.built)return;
  const {def,profile,paint,rubber,rotorMaterial,caliperMaterial,trimMaterial}=context,id=def.id??'traffic',isTraffic=context.traffic===true,w=def.width/2,L=def.length/2;
  const own=mat=>{root.userData.ownedMaterials.push(mat);return mat;},steel=own(new T.MeshStandardMaterial({color:0x687078,metalness:.95,roughness:.36})),dark=own(new T.MeshStandardMaterial({color:0x10171b,metalness:.22,roughness:.63})),rimMetal=own(new T.MeshPhysicalMaterial({color:0x90999f,metalness:1,roughness:.31,clearcoat:.25})),rubberHero=own(rubber.clone()),enamel=own(new T.MeshPhysicalMaterial({color:id==='safari'?0x454e51:0x9b291d,metalness:.45,roughness:.30,clearcoat:.7})),seat=own(new T.MeshStandardMaterial({color:0x161d21,roughness:.93})),thread=own(new T.MeshStandardMaterial({color:0x5a6265,roughness:.89})),white=own(new T.MeshStandardMaterial({color:0xd9efff,emissive:0x8fbdde,emissiveIntensity:.32}));
  rubberHero.roughness=.88;rubberHero.normalScale.set(.035,.035);
  const label=id==='safari'?'HEAVY RADIAL':isTraffic?'ROAD RADIAL':'SPORT RADIAL',stamp=sidewallMap(label),sidewall=own(new T.MeshStandardMaterial({color:0x3c4246,map:stamp,bumpMap:stamp,bumpScale:.0012,roughness:.9,side:T.DoubleSide}));
  heroPaint=own(paint.clone());heroPaint.map=paintFlake;heroPaint.normalMap=paintNormal;heroPaint.normalScale.set(.006,.006);heroPaint.roughnessMap=paintRough;heroPaint.clearcoatRoughness=Math.min(heroPaint.clearcoatRoughness,.065);heroPaint.clearcoatNormalMap=paintNormal;heroPaint.clearcoatNormalScale=new T.Vector2(.003,.003);
  root.traverse(m=>{if(m.isMesh&&m.material===paint)paintMeshes.push(m);});
  const fixed=new T.Group();fixed.name='Original Ultra+ stationary vehicle detail';root.add(fixed);parts.push(fixed);
  for(const mesh of root.children)if(mesh.isMesh&&mesh.material===caliperMaterial)replacements.push({mesh,visible:mesh.visible});
  for(const wheel of root.userData.wheels){
   const r=wheel.userData.radius,side=Math.sign(wheel.position.x),outer=side*.145;
   for(const mesh of wheel.children)if(mesh.isMesh&&(mesh.material===rubber||mesh.material===rotorMaterial||mesh.material===trimMaterial))replacements.push({mesh,visible:mesh.visible});
   const detail=new T.Group();detail.name='Original Ultra+ rotating wheel detail';wheel.add(detail);parts.push(detail);state.rotatingGroups++;
   const tire=add(detail,partGeometry(id==='safari'?'offroadTire':isTraffic||id==='silver'||id==='electric'?'roadTire':'sportTire'),rubberHero);tire.scale.set(1,r,r);
   const rotor=add(detail,partGeometry('drilledRotor'),steel,outer-side*.04);rotor.scale.setScalar(r);
   // Machining lines and internal ventilation vanes remain separate visible
   // surfaces around the physically drilled Blender rotor.
   for(const rr of [.29,.32,.50,.535])ring(detail,r*rr,.00065,outer+side*(-.04+r*.021),steel,96);
   for(let i=0;i<28;i++){const a=i*Math.PI/14,v=box(detail,.008,.003,r*.12,outer-side*.043,Math.sin(a)*r*.50,Math.cos(a)*r*.50,dark);v.rotation.x=-a;}
   for(const rr of [.705,.735])ring(detail,r*rr,.0030,outer+side*.031,rimMetal,96);
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5,bolt=add(detail,new T.CylinderGeometry(.008,.008,.009,6),steel,outer+side*.054,Math.sin(a)*.040,Math.cos(a)*.040);bolt.rotation.z=Math.PI/2;}
   for(let i=0;i<32;i++){const a=i*Math.PI/16,mark=box(detail,.002,.003,.007,side*.143,Math.sin(a)*r*.87,Math.cos(a)*r*.87,rubberHero);mark.rotation.x=-a;}
   annularSidewall(detail,r,side*.1455,sidewall,side);
   const valve=box(detail,.016,.008,.009,outer+side*.030,r*.65,0,dark);valve.rotation.z=side*.25;
   const wx=wheel.position.x,wy=wheel.position.y,wz=wheel.position.z,caliper=add(fixed,partGeometry('beveledCaliper'),enamel,wx+outer-side*.073,wy+.07,wz+.15);caliper.scale.setScalar(r);
   for(const dy of [-.04,.04])sphere(fixed,.006,wx+outer+side*.006,wy+.07+dy,wz+.15,steel);
   rod(fixed,[wx+outer-side*.06,wy+.15,wz+.15],[wx+outer-side*.085,wy+.26,wz+.06],.004,dark);
   if(context.batching())batch(detail);
  }
  // Cabin details are intentionally placed where side/front windows expose
  // them. No invisible engine or underbody triangle inflation is added.
  const cabin=profile?.cabin;
  if(cabin){const a=cabin[0],b=cabin[1],c=cabin.at(-2),d=cabin.at(-1),base=Math.min(a[2],d[2])+.025,cw=Math.min(a[1],b[1])*1.66,seatZ=Math.min(c[0]-.15,b[0]+.56),headY=Math.min(base+.49,Math.min(b[4],c[4])-.12);
   for(const side of [-1,1]){const x=side*cw*.245;for(const dx of [-.13,.13])rod(fixed,[x+dx,base+.08,seatZ-.22],[x+dx,base+.08,seatZ+.01],.0020,thread);rod(fixed,[x-.11,headY-.02,seatZ+.06],[x+.11,headY-.02,seatZ+.06],.0020,thread);box(fixed,.026,.014,.028,x+side*.16,base+.12,seatZ-.08,enamel);rod(fixed,[side*cw*.47,base+.11,seatZ-.08],[side*cw*.47,base+.41,seatZ+.03],.009,seat);}
   const dashboardZ=a[0]+.24,dashY=base+.18,steering=add(fixed,new T.TorusGeometry(.104,.012,8,40),seat,-cw*.245,dashY+.065,dashboardZ+.14);steering.rotation.x=-.28;rod(fixed,[-cw*.245,dashY+.065,dashboardZ+.14],[-cw*.245,dashY+.01,dashboardZ-.07],.017,dark);
   for(let n=0;n<3;n++){const ang=n*Math.PI*2/3;rod(fixed,[-cw*.245,dashY+.065,dashboardZ+.14],[-cw*.245+Math.sin(ang)*.096,dashY+.065+Math.cos(ang)*.096,dashboardZ+.14],.006,steel);}
   const screen=own(new T.MeshStandardMaterial({color:0x0b2535,emissive:0x102d42,emissiveIntensity:.4,roughness:.16,metalness:.15}));box(fixed,.17,.075,.012,0,dashY+.019,dashboardZ+.05,dark);box(fixed,.144,.051,.013,0,dashY+.019,dashboardZ+.058,screen);for(let n=0;n<4;n++)box(fixed,.020,.004,.001,-.05+n*.033,dashY+.030,dashboardZ+.066,white);
   for(const side of [-1,1])for(let n=0;n<5;n++)box(fixed,.087,.002,.006,side*cw*.32,dashY-.025+n*.006,dashboardZ+.104,dark);
  }
  // Exposed light optics, mirror inset and small fasteners vary with each body.
  for(const side of [-1,1]){
   const mirrorZ=isTraffic?(context.mirrorZ??-.47):id==='silver'||id==='muscle'?-.14:-.51,mirrorY=isTraffic?(context.mirrorY??1.02):(profile.waist+.21),mirrorX=side*(w-.09);
   box(fixed,.012,.044,.075,mirrorX-side*.092,mirrorY,mirrorZ+.082,rimMetal);
   if(['black','red','rally'].includes(id))for(const z of [-L+.28,L-.26])for(const dy of [0,.020])sphere(fixed,.0034,side*w*.82,(profile.waist??.8)-.14+dy,z,steel);
   const y=isTraffic?.625+(context.waistOffset??0)*.65:id==='safari'?.93:id==='muscle'?.642:id==='rally'?.73:id==='silver'?.66:id==='electric'?.61:.49;
   if(isTraffic||id==='muscle'||id==='safari'){const x=side*w*(id==='safari'?.61:.64);for(const dx of [-.055,.055]){const lens=add(fixed,new T.TorusGeometry(id==='safari'?.061:.027,.0025,7,40),rimMetal,x+dx,y,-L-.029);lens.rotation.x=.05;sphere(fixed,.009,x+dx,y,-L-.034,white);}}
  }
  if(context.batching())batch(fixed);
  for(const group of parts)group.traverse(m=>{if(m.isMesh){state.meshCount++;state.triangleCount+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;}});
  state.built=true;
 };
 root.userData.setVehicleQuality=name=>{const enabled=name==='Ultra+';if(enabled)build();for(const group of parts)group.visible=enabled;for(const {mesh,visible} of replacements)mesh.visible=enabled?false:visible;for(const mesh of paintMeshes)mesh.material=enabled?heroPaint:context.paint;state.quality=name;state.active=enabled;return state;};
 return root;
}
