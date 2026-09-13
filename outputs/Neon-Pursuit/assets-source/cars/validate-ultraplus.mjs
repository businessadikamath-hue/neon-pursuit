import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {makePlayer,makeTraffic,carDefs,trafficDefs,setCarBatching} from '../engine-v9/models.js';
import {heroVehicleParts} from '../engine-v9/heroVehicleParts.js';
const report=[];
for(const [name,factory] of [...Object.keys(carDefs).map(id=>[id,()=>makePlayer(id)]),...trafficDefs.map(([name],i)=>[name,()=>makeTraffic(i,i===0)])]){
 const pair=[];
 for(const batching of [false,true]){
  setCarBatching(batching);const root=factory(),before=[];root.traverse(mesh=>{if(mesh.isMesh)before.push({mesh,material:mesh.material,visible:mesh.visible});});
  root.userData.setVehicleQuality('High');assert.equal(root.userData.vehicleDetailTier.built,false);
  root.userData.setVehicleQuality('Ultra+');const state=root.userData.vehicleDetailTier;assert(state.active&&state.built);assert.equal(state.rotatingGroups,4);assert(state.triangleCount>150000);
  const materialCount=root.userData.ownedMaterials.length,geometryIds=[];root.traverse(m=>{if(m.isMesh){geometryIds.push(m.geometry.uuid);for(const attr of Object.values(m.geometry.attributes))for(const n of attr.array)assert(Number.isFinite(n),name+' invalid attribute');}});
  for(const wheel of root.userData.wheels){assert(wheel.children.some(g=>g.name==='Original Ultra+ rotating wheel detail'));const detail=wheel.children.find(g=>g.name==='Original Ultra+ rotating wheel detail');assert(detail.visible);assert.equal(detail.parent,wheel);}
  root.userData.setVehicleQuality('Ultra');for(const old of before){assert.equal(old.mesh.material,old.material,name+' baseline material not restored');assert.equal(old.mesh.visible,old.visible,name+' baseline visibility not restored');}
  root.userData.setVehicleQuality('Ultra+');assert.equal(root.userData.ownedMaterials.length,materialCount);const after=[];root.traverse(m=>{if(m.isMesh)after.push(m.geometry.uuid)});assert.deepEqual(after,geometryIds,name+' repeated activation allocates geometry');
  root.userData.setVehicleQuality('Game Only');assert.equal(state.active,false);
  let geometryDisposed=0,materialDisposed=0;root.traverse(m=>{if(m.isMesh){m.geometry.addEventListener('dispose',()=>geometryDisposed++);m.geometry.dispose();}});for(const mat of root.userData.ownedMaterials){mat.addEventListener('dispose',()=>materialDisposed++);mat.dispose();}assert.equal(geometryDisposed,geometryIds.length);assert.equal(materialDisposed,materialCount);
  pair.push({batching,extraMeshes:state.meshCount,extraTriangles:state.triangleCount,geometriesReachableForDisposal:geometryDisposed,ownedMaterials:materialCount});
 }
 assert.equal(pair[0].extraTriangles,pair[1].extraTriangles,name+' batching changes triangles');report.push({name,pass:true,modes:pair});
}
const partReports=[];
for(const [name,part] of Object.entries(heroVehicleParts)){
 const decode=(s,Type)=>new Type(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer),p=decode(part.position,Float32Array),n=decode(part.normal,Int16Array),idx=decode(part.index,Uint32Array);assert.equal(p.length,part.vertices*3);assert.equal(idx.length,part.triangles*3);for(const i of idx)assert(i<part.vertices);let sample=0,outward=0;if(name.endsWith('Tire'))for(let i=0;i<p.length;i+=3)if(Math.abs(p[i])<.095&&Math.hypot(p[i+1],p[i+2])>.98){sample++;if(p[i+1]*n[i+1]+p[i+2]*n[i+2]>0)outward++;}if(sample)assert(outward/sample>.98,name+' inward tire normals');partReports.push({name,vertices:part.vertices,triangles:part.triangles,outwardTreadNormalFraction:sample?outward/sample:null});
 if(name==='drilledRotor'){let capTriangles=0,maxDeviation=0;for(let k=0;k<idx.length;k+=3){const indices=[idx[k],idx[k+1],idx[k+2]],xs=indices.map(i=>p[i*3]),sign=Math.sign(xs[0]);if(xs.every(x=>Math.sign(x)===sign&&Math.abs(x)>.01899)&&Math.max(...xs)-Math.min(...xs)<1e-6){const ab=[0,1,2].map(j=>p[indices[1]*3+j]-p[indices[0]*3+j]),ac=[0,1,2].map(j=>p[indices[2]*3+j]-p[indices[0]*3+j]),area=Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])/2;if(area<1e-12)continue;capTriangles++;for(const i of indices)maxDeviation=Math.max(maxDeviation,Math.abs(n[i*3]/32767-sign),Math.abs(n[i*3+1]/32767),Math.abs(n[i*3+2]/32767));}}assert(capTriangles>100);assert(maxDeviation<.001,'planar rotor cap has tilted corner normals');Object.assign(partReports.at(-1),{planarCapTriangles:capTriangles,maxPlanarNormalDeviation:maxDeviation});}
}
setCarBatching(true);writeFileSync(new URL('./ultraplus-validation.json',import.meta.url),JSON.stringify({pass:true,vehicles:report,parts:partReports,baselineRestored:true,lazyReuse:true,disposalAccessible:true},null,2));console.log(JSON.stringify({pass:true,models:report.length,modes:40,parts:partReports},null,2));
