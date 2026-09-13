import * as T from 'three';
import {buildWildlifeModel,buildBirdModel,createWildlifeMaterial} from '../engine/wildlifeArt.js';
import {buildGroomedFur} from '../engine/wildlifeDetail8.js';
import fs from 'node:fs';
import zlib from 'node:zlib';
const data={origin:'Actual assembled original Ultra+ runtime geometry, exported for Blender review',subjects:[]};
const encode=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
function geometry(g,kind,p=[0,0,0],rot=[0,0,0],map=null,clip=null){
 if(!g)return null;let copy=g.index?g.toNonIndexed():g.clone();const source=copy.attributes.position,col=copy.attributes.color,uv=copy.attributes.uv,normal=copy.attributes.normal;
 if(map&&uv){const image=map.image;for(let i=0;i<col.count;i++){const u=((uv.getX(i)%1)+1)%1,v=((uv.getY(i)%1)+1)%1,j=(Math.floor(v*image.height)*image.width+Math.floor(u*image.width))*4,c=new T.Color().setRGB(image.data[j]/255,image.data[j+1]/255,image.data[j+2]/255,T.SRGBColorSpace);col.setXYZ(i,col.getX(i)*c.r,col.getY(i)*c.g,col.getZ(i)*c.b);}}
 const positions=[],colors=[],normals=[];
 for(let i=0;i<source.count;i+=3){if(clip&&[0,1,2].some(j=>source.getZ(i+j)>clip))continue;for(let j=0;j<3;j++){positions.push(source.getX(i+j),source.getY(i+j),source.getZ(i+j));colors.push(col.getX(i+j),col.getY(i+j),col.getZ(i+j));normals.push(normal.getX(i+j),normal.getY(i+j),normal.getZ(i+j));}}
 copy.dispose();return {kind,p,rot,positions:encode(new Float32Array(positions)),colors:encode(new Float32Array(colors)),normals:encode(new Float32Array(normals))};
}
const names=[['Red fox','Herring gull'],['Reindeer','Snowy owl'],['Bighorn sheep','Red-tailed hawk'],['Jaguar','Scarlet macaw']];
for(let biome=0;biome<4;biome++){
 const [name,birdName]=names[biome],m=buildWildlifeModel(name,{ultra:true}),c=m.config,mat=createWildlifeMaterial(name),full=[];
 for(const part of['body','fur'])full.push(geometry(m.parts[part],part==='fur'?'fur':'coat',[0,0,0],[0,0,0],mat.map));
 full.push(geometry(buildGroomedFur(c),'fur'));
 full.push(geometry(m.parts.head,'coat',m.headPivot,[0,0,0],mat.map));for(const kind of['eyes','wet','fur'])full.push(geometry(m.detail[kind],kind,m.headPivot));full.push(geometry(m.parts.tail,'coat',m.tailPivot));
 if(m.parts.leg)for(let k=0;k<4;k++)full.push(geometry(m.parts.leg,'coat',[(k%2?-1:1)*c.width*.67,c.height-.10,(k<2?-.33:.34)*c.length]));
 const close=[geometry(m.parts.head,'coat',[0,0,0],[0,0,0],mat.map),...['eyes','wet','fur'].map(kind=>geometry(m.detail[kind],kind))];
 data.subjects.push({name,biome,type:'mammal',full:full.filter(Boolean),close:close.filter(Boolean)});
 const b=buildBirdModel(birdName,{ultra:true}),hz=-.29-b.config.neck,birdFull=[geometry(b.body,'feathers'),geometry(b.wing,'feathers',[.071,.012,-.025],[0,0,.25]),geometry(b.leftWing,'feathers',[-.071,.012,-.025],[0,0,-.25]),geometry(b.detail.eyes,'eyes'),geometry(b.detail.wet,'wet')];
 const birdClose=[geometry(b.body,'feathers',[0,-.08,-hz],[0,0,0],null,hz+.145),geometry(b.detail.eyes,'eyes',[0,-.08,-hz]),geometry(b.detail.wet,'wet',[0,-.08,-hz])];
 data.subjects.push({name:birdName,biome,type:'bird',full:birdFull.filter(Boolean),close:birdClose.filter(Boolean)});
}
fs.writeFileSync('work/wildlife-assets-v9/assembled-v8.json.gz',zlib.gzipSync(JSON.stringify(data)));console.log(JSON.stringify({subjects:data.subjects.map(s=>s.name),bytes:fs.statSync('work/wildlife-assets-v8/assembled-gallery.json.gz').size}));
