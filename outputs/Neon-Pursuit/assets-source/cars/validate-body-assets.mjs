import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {blenderVehicleBodies} from '../engine-v9/blenderVehicleBodiesV8.js';
const decode=(s,Type)=>new Type(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer),reports=[];
assert.equal(Object.keys(blenderVehicleBodies).length,20);
for(const [id,body] of Object.entries(blenderVehicleBodies)){
 const p=decode(body.position,Int16Array),n=decode(body.normal,Int16Array),u=decode(body.uv,Float32Array),idx=decode(body.index,Uint16Array);
 assert.equal(p.length,body.vertexCount*3);assert.equal(n.length,p.length);assert.equal(idx.length,body.triangleCount*3);
 let degenerateUV=0,degenerateArea=0,totalArea=0,minNormal=2,maxNormal=0;
 for(let k=0;k<n.length;k+=3){const length=Math.hypot(n[k],n[k+1],n[k+2])/32767;minNormal=Math.min(minNormal,length);maxNormal=Math.max(maxNormal,length);}
 assert(minNormal>.999&&maxNormal<1.001,id+' nonunit normals');
 for(let k=0;k<idx.length;k+=3){const [a,b,c]=idx.slice(k,k+3);assert(Math.max(a,b,c)<body.vertexCount);const dx=(u[b*2]-u[a*2]),dy=(u[b*2+1]-u[a*2+1]),ex=(u[c*2]-u[a*2]),ey=(u[c*2+1]-u[a*2+1]);const ab=[0,1,2].map(j=>(p[b*3+j]-p[a*3+j])/10000),ac=[0,1,2].map(j=>(p[c*3+j]-p[a*3+j])/10000),area=Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])/2;totalArea+=area;if(dx*ey-dy*ex===0){degenerateUV++;degenerateArea+=area;}}
 assert(degenerateArea/totalArea<.0001,id+' substantial collapsed UV area');
 assert(body.panelSeams.length>=2,id+' missing body fitted seams');
 for(const line of body.panelSeams)for(const point of line)assert(point.length===3&&point.every(Number.isFinite));
 reports.push({id,vertices:body.vertexCount,triangles:body.triangleCount,minNormal,maxNormal,quantizedDegenerateUvTriangles:degenerateUV,degenerateUvSurfaceFraction:degenerateArea/totalArea,fittedSeams:body.panelSeams.length});
}
writeFileSync(new URL('./body-validation-report.json',import.meta.url),JSON.stringify({pass:true,models:reports},null,2));console.table(reports);
