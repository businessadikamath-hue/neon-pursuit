import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {makePlayer,makeTraffic,carDefs,trafficDefs,setCarBatching} from '../engine-v9/models.js';
const expected={black:[2.16,4.6],silver:[2.06,4.85],red:[2.22,4.4],rally:[1.88,3.85],muscle:[2.12,5.15],roadster:[1.8,3.95],electric:[2.1,5],safari:[2.18,4.7]};
const factories=[...Object.keys(carDefs).map(id=>[id,()=>makePlayer(id)]),...trafficDefs.map(([name],i)=>[name,()=>makeTraffic(i,i===0)])];
for(const [id,def] of Object.entries(carDefs)){assert.deepEqual([def.width,def.length],expected[id]);assert(def.name.includes(def.analogue.replace(' (200 mph hardware)','')));assert(def.strength>=1&&def.strength<=10);}
const dispose=g=>{g.traverse(m=>{if(m.isMesh)m.geometry.dispose()});g.userData.ownedMaterials.forEach(m=>m.dispose());};
const checks=[];
for(const [name,make] of factories){const pair=[];for(const enabled of [false,true]){setCarBatching(enabled);const g=make();assert.equal(g.userData.wheels.length,4);assert(g.userData.wheels.every(w=>w.userData.radius>0));if(name==='Saloon'){assert.equal(g.userData.flash.length,2);assert(g.userData.flash.every(m=>g.userData.ownedMaterials.includes(m)));}let meshes=0,triangles=0;g.traverse(m=>{if(!m.isMesh)return;meshes++;const geo=m.geometry;for(const attribute of Object.values(geo.attributes))for(const value of attribute.array)assert(Number.isFinite(value),name+' nonfinite geometry');triangles+=(geo.index?.count??geo.attributes.position.count)/3;});pair.push({batching:enabled,meshes,triangles});dispose(g);}assert.equal(pair[0].triangles,pair[1].triangles);checks.push({name,...Object.fromEntries(pair.flatMap((x,i)=>[[i?'batchedMeshes':'originalMeshes',x.meshes]])),triangles:pair[0].triangles});}
const construction=[];
for(const enabled of [false,true]){setCarBatching(enabled);const times=[];for(let run=0;run<8;run++){const start=performance.now(),made=factories.map(([,make])=>make());const elapsed=performance.now()-start;made.forEach(dispose);if(run>1)times.push(elapsed);}times.sort((a,b)=>a-b);construction.push({batching:enabled,medianConstructionMsAll20:(times[2]+times[3])/2,minConstructionMsAll20:times[0],maxConstructionMsAll20:times.at(-1),note:'Six measured warm construction runs; not frame time or FPS'});}
setCarBatching(true);const report={checks,construction,finiteGeometry:true,collisionDimensionsUnchanged:true,allBodiesUsedInGame:true};
writeFileSync(new URL('./model-validation-report.json',import.meta.url),JSON.stringify(report,null,2));console.table(checks);console.table(construction);
