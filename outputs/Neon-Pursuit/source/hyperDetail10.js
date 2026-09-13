import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// V10 hero pass: small, camera-facing geometry that makes the vehicle read as
// a manufactured object rather than a single smooth body shell. Everything is
// generated locally so the offline package remains self contained.
const seamMat=new T.MeshStandardMaterial({color:0x030607,roughness:.88,metalness:0});
const creaseMat=new T.MeshStandardMaterial({color:0x0a0f12,roughness:.70,metalness:.12});
const recessMat=new T.MeshStandardMaterial({color:0x05090c,roughness:.84,metalness:.04});
const chromeMat=new T.MeshPhysicalMaterial({color:0xb9c6ca,metalness:1,roughness:.18,clearcoat:.65,clearcoatRoughness:.08});
const plateBlack=new T.MeshPhysicalMaterial({color:0x071015,metalness:.34,roughness:.20,clearcoat:1,clearcoatRoughness:.055});
const plateWhite=new T.MeshPhysicalMaterial({color:0xc9e7e4,metalness:.42,roughness:.24,clearcoat:.85,clearcoatRoughness:.08});
const cyan=new T.MeshStandardMaterial({color:0x7df9ff,emissive:0x16dce8,emissiveIntensity:3.8,roughness:.22,metalness:.12});
const magenta=new T.MeshStandardMaterial({color:0xff8cf0,emissive:0xf02ccc,emissiveIntensity:3.2,roughness:.22,metalness:.12});
const glyphShadow=new T.MeshStandardMaterial({color:0x000204,roughness:.94,metalness:0});
const interiorMat=new T.MeshStandardMaterial({color:0x121c21,roughness:.78,metalness:.12});
const interiorSoft=new T.MeshStandardMaterial({color:0x28353a,roughness:.92,metalness:.04});
const dashScreen=new T.MeshStandardMaterial({color:0x082638,emissive:0x0d8db0,emissiveIntensity:1.2,roughness:.18,metalness:.2});

const glyphs={
 '0':['11111','10001','10011','10101','11001','10001','11111'],
 '1':['00100','01100','00100','00100','00100','00100','01110'],
 '2':['11110','00001','00001','00110','01000','10000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['10010','10010','10010','11111','00010','00010','00010'],
 '5':['11111','10000','10000','11110','00001','00001','11110'],
 '6':['01110','10000','10000','11110','10001','10001','01110'],
 '7':['11111','00001','00010','00100','01000','01000','01000'],
 '8':['01110','10001','10001','01110','10001','10001','01110'],
 '9':['01110','10001','10001','01111','00001','00001','01110'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 B:['11110','10001','10001','11110','10001','10001','11110'],
 C:['01111','10000','10000','10000','10000','10000','01111'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 M:['10001','11011','10101','10101','10001','10001','10001'],
 N:['10001','11001','10101','10011','10001','10001','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 P:['11110','10001','10001','11110','10000','10000','10000'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 S:['01111','10000','10000','01110','00001','00001','11110'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 V:['10001','10001','10001','10001','10001','01010','00100'],
 X:['10001','10001','01010','00100','01010','10001','10001'],
 Y:['10001','10001','01010','00100','00100','00100','00100']
};

const plateText={black:'N7N 042',silver:'G7T 204',red:'EMB 003',rally:'RX 808',muscle:'V8 426',roadster:'AER 021',electric:'EV 808',safari:'OUT 4X4'};
const clamp=T.MathUtils.clamp;

function add(root,geometry,material,x=0,y=0,z=0,cast=true){const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=cast;mesh.receiveShadow=true;root.add(mesh);return mesh;}
function box(root,w,h,d,x,y,z,material,cast=true){return add(root,new T.BoxGeometry(w,h,d),material,x,y,z,cast);}
function round(root,w,h,d,x,y,z,material,r=.008){return add(root,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),material,x,y,z);}
function sphere(root,r,x,y,z,material){return add(root,new T.SphereGeometry(r,12,8),material,x,y,z);}
function tube(root,points,r,material){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return add(root,new T.TubeGeometry(curve,Math.max(8,points.length*6),r,6,false),material);}

function plateGlyph(root,char,x,y,z,scale,material,face=1){const rows=glyphs[char];if(!rows)return;const cell=scale/7,depth=.007;
 for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(rows[row][col]==='1'){
   // Dark relief behind each stroke creates an actual raised letter edge.
   box(root,cell*.78,cell*.78,depth*.95,x+(col-2)*cell,y+(3-row)*cell,z+face*.004,glyphShadow,false);
   box(root,cell*.72,cell*.72,depth,x+(col-2)*cell,y+(3-row)*cell,z+face*.010,material,false);
   box(root,cell*.20,cell*.16,depth*.45,x+(col-2)*cell-cell*.16,y+(3-row)*cell+cell*.17,z+face*.014,plateWhite,false);
 }
}

function addPlate(root,def,hero,face=1){
 const id=def.id??'traffic',L=def.length/2,w=def.width/2,plateWidth=hero?.54:Math.min(.48,w*.62),plateHeight=hero?.145:.11;
 const y=id==='safari'?.79:id==='rally'?.52:id.startsWith('traffic')?.49:.49,z=L+.026;
 const plateZ=face>0?z:-L-.026;
 const base=round(root,plateWidth,plateHeight,.020,0,y,plateZ,plateBlack,.010);base.name=`Neon mock license plate backing ${face>0?'front':'rear'}`;
 // A cool rim and a warm lower registration bar give the plate readable depth.
 const rim=.008,glowDepth=plateZ+face*.018;
 box(root,plateWidth+.022,rim,.010,0,y+plateHeight/2+.006,glowDepth,cyan,false);
 box(root,plateWidth+.022,rim,.010,0,y-plateHeight/2-.006,glowDepth,magenta,false);
 box(root,rim,plateHeight,.010,-plateWidth/2-.006,y,glowDepth,magenta,false);
 box(root,rim,plateHeight,.010,plateWidth/2+.006,y,glowDepth,cyan,false);
 box(root,plateWidth*.78,.006,.008,0,y-plateHeight*.27,plateZ+face*.018,plateWhite,false);
 const label=(plateText[id]??`NP ${String(root.id%1000).padStart(3,'0')}`).replace(/ /g,'');
 const glyphScale=plateHeight*.62,advance=glyphScale*.79,total=(label.length-1)*advance;
 for(let i=0;i<label.length;i++)plateGlyph(root,label[i],(i/(Math.max(1,label.length-1))-.5)*total,y+.004,plateZ+face*.020,glyphScale,i%3===1?magenta:cyan,face);
 for(const sx of [-1,1]){const screw=new T.Mesh(new T.CylinderGeometry(.010,.010,.010,16),chromeMat);screw.rotation.x=Math.PI/2;screw.position.set(sx*(plateWidth/2-.035),y,plateZ+face*.020);screw.castShadow=false;root.add(screw);}
 root.userData.hyperNeonPlates??=[];root.userData.hyperNeonPlates.push(cyan,magenta);root.userData.hyperPlate={text:label,width:plateWidth,height:plateHeight,raisedCharacters:true,neonBorder:true};
}

function addDoorSurfaces(root,def,profile,hero){
 const id=def.id??'traffic',L=def.length/2,w=def.width/2;
 const cabin=profile?.cabin,front=cabin?.[0]?.[0]??-L*.40,rear=cabin?.at(-1)?.[0]??L*.28;
 const z0=clamp(front+.25,-L*.72,L*.18),z1=clamp(rear-.30,-L*.05,L*.72),y0=id==='safari'?.74:.32;
 const y1=id==='safari'?1.55:Math.min((profile?.height??1.2)*.72,.90),sideX=side=>side*(w+.010);
 for(const side of [-1,1]){
   // Slightly inset door skins create a second shadow boundary below the seam.
   const panelMat=new T.MeshStandardMaterial({color:id==='black'||id==='electric'?0x0b1115:0x222a2c,roughness:.58,metalness:.18,transparent:true,opacity:.24,side:T.DoubleSide});
   const panel=add(root,new T.BufferGeometry(),panelMat,0,0,0,false);const py0=y0+.045,py1=y1-.09,pz0=z0+.06,pz1=z1-.06;
   panel.geometry.setAttribute('position',new T.Float32BufferAttribute([sideX(side),py0,pz0,sideX(side),py1,pz0,sideX(side),py1,pz1,sideX(side),py0,pz1],3));panel.geometry.setIndex([0,1,2,0,2,3]);panel.geometry.computeVertexNormals();panel.name='Inset door skin with manufactured shadow';
   root.userData.ownedMaterials?.push(panelMat);
   tube(root,[[sideX(side),y0,z0],[sideX(side)*1.004,(y0+y1)*.48,z0+.015],[sideX(side),y1,z0+.025]],.0048,seamMat);
   tube(root,[[sideX(side),y0,z1],[sideX(side)*1.004,(y0+y1)*.50,z1-.012],[sideX(side),y1,z1-.018]],.0048,seamMat);
   tube(root,[[sideX(side),y0+.012,z0+.06],[sideX(side),y0+.012,(z0+z1)*.50],[sideX(side),y0+.012,z1-.06]],.0055,creaseMat);
   tube(root,[[sideX(side),y1-.035,z0+.08],[sideX(side),y1-.030,(z0+z1)*.50],[sideX(side),y1-.045,z1-.08]],.0027,seamMat);
   const handleZ=(z0+z1)*.52,handleY=id==='safari'?1.34:.65;
   box(root,.135,.026,.035,sideX(side)+side*.014,handleY,handleZ,recessMat,false);
   round(root,.085,.013,.025,sideX(side)+side*.022,handleY+.004,handleZ+.005,chromeMat,.004);
   for(const zz of [z0+.025,z1-.025])sphere(root,.010,sideX(side)+side*.015,y0+.08,zz,chromeMat);
   // A lower sill catches a long highlight and separates the door from the rocker.
   tube(root,[[sideX(side),y0-.025,z0+.06],[sideX(side)*1.003,y0-.030,(z0+z1)*.5],[sideX(side),y0-.022,z1-.06]],.009,recessMat);
   if(hero){
     // Tiny fasteners and a side marker make the panel scale read in close views.
     for(const zz of [z0+.12,(z0+z1)*.5,z1-.12])sphere(root,.004,sideX(side)+side*.017,y0+.055,zz,chromeMat);
     const marker=new T.MeshStandardMaterial({color:0xd9f6ff,emissive:0x49d8ff,emissiveIntensity:1.7,roughness:.22});root.userData.ownedMaterials?.push(marker);box(root,.026,.010,.006,sideX(side)+side*.021,.52,(z0+z1)*.36,marker,false);
   }
 }
 root.userData.hyperDoors={front:z0,rear:z1,sideSeams:4,insetSkins:2,handles:2};
}

function addCabinInterior(root,def,profile){
 if(!profile?.cabin)return;
 const id=def.id??'traffic',w=def.width/2,cabin=profile.cabin,a=cabin[0],b=cabin[1],d=cabin.at(-1),base=Math.min(a[2],d[2])+.055;
 const seatZ=(b[0]+d[0])*.48,headY=Math.min(base+.49,Math.min(b[4],d[4])-.12),cw=Math.min(a[1],b[1])*1.58;
 box(root,cw*.80,.11,.34,0,base+.16,a[0]+.30,interiorMat,false);
 for(const side of [-1,1]){const x=side*cw*.245;
   round(root,.27,.30,.30,x,base+.30,seatZ,interiorSoft,.045);
   round(root,.29,.065,.34,x,base+.105,seatZ-.09,interiorMat,.018);
   round(root,.20,.19,.075,x,headY,seatZ+.035,interiorMat,.025);
   tube(root,[[x-.095,base+.19,seatZ-.14],[x-.095,base+.35,seatZ+.09]],.0022,chromeMat);
   tube(root,[[x+.095,base+.19,seatZ-.14],[x+.095,base+.35,seatZ+.09]],.0022,chromeMat);
 }
 const dashZ=a[0]+.30,dashY=base+.19;box(root,cw*1.03,.16,.18,0,dashY,dashZ,interiorMat,false);box(root,.24,.082,.012,0,dashY+.045,dashZ+.098,dashScreen,false);
 for(let i=0;i<6;i++)box(root,.018,.006,.004,-.09+i*.036,dashY+.055,dashZ+.107,cyan,false);
 const steering=add(root,new T.TorusGeometry(.112,.013,10,40),interiorMat,-cw*.245,dashY+.10,dashZ+.17,false);steering.rotation.x=-.30;
 tube(root,[[-cw*.245,dashY+.10,dashZ+.17],[-cw*.245,dashY+.03,dashZ+.03]],.016,chromeMat);
 root.userData.hyperInterior={transparentGlazingReadable:true,seats:2,dashboard:true,steeringWheel:true,display:true};
}

export function installHyperVehicleDetail10(root,{def,profile,hero=true}={}){
 if(!root||root.userData.hyperDetail10)return root;
 root.userData.hyperDetail10=true;root.userData.hyperDetailRevision=10;
 addPlate(root,def,hero,1);
 // The driving camera follows the car from behind, so a second modeled plate
 // keeps the readable glyph relief visible in the actual gameplay view.
 addPlate(root,def,hero,-1);
 addDoorSurfaces(root,def,profile,hero);
 if(hero)addCabinInterior(root,def,profile);
 return root;
}
