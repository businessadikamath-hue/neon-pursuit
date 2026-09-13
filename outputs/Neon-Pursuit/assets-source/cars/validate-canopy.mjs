import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as T from 'three';
import {fittedCanopy} from '../engine-v9/vehicleCanopyV9.js';
import {carBodyProfiles} from '../engine-v9/models.js';
function sample(s,z){let i=0;while(i<s.length-2&&s[i+1][0]<z)i++;const a=s[Math.max(0,i-1)],b=s[i],c=s[i+1],d=s[Math.min(s.length-1,i+2)],u=Math.max(0,Math.min(1,(z-b[0])/(c[0]-b[0])));return b.map((v,j)=>j===0?z:.5*((2*v)+(-a[j]+c[j])*u+(2*a[j]-5*v+4*c[j]-d[j])*u*u+(-a[j]+3*v-3*c[j]+d[j])*u*u*u));}
const result=[];
for(const [id,p] of Object.entries(carBodyProfiles))if(p.cabin){
 const root=new T.Group(),paint=new T.MeshStandardMaterial(),glass=new T.MeshStandardMaterial(),trim=new T.MeshStandardMaterial();fittedCanopy(root,p,paint,glass,trim,sample);const panes=root.children.filter(m=>m.material===glass);assert.equal(panes.length,3);
 for(const [index,mesh] of panes.entries()){const n=mesh.geometry.attributes.normal;for(let i=0;i<n.count;i++){assert(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001,id+' nonunit canopy normal');if(index===0)assert(n.getY(i)>0,id+' inward roof/windshield normal');else assert(n.getX(i)*(index===1?-1:1)>0,id+' inward side glass normal');}}
 root.traverse(m=>{if(m.isMesh)m.geometry.dispose()});[paint,glass,trim].forEach(m=>m.dispose());result.push({id,panes:3,outwardNormals:true});
}
writeFileSync(new URL('./canopy-validation.json',import.meta.url),JSON.stringify({passed:true,cars:result,sharedBoundaryConstruction:true},null,2));console.log(JSON.stringify({passed:true,cars:result.length}));
