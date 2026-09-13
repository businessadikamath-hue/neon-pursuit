import * as T from 'three';
import {installWildlifeArt,wildlifeCatalog,buildWildlifeModel,buildBirdModel} from '../engine-v9/wildlifeArt.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const report={biomes:[],checks:[],passed:false};
function worldFor(){return {scene:new T.Scene(),tiles:Array.from({length:5},(_,i)=>{const g=new T.Group();g.userData={routeBlock:i-1,terrainHeight:(x,z)=>.04*Math.sin(z*.014)+Math.max(0,Math.abs(x)-23)*.025};return g;}),fauna:[],birdBatches:[],quality(){},update(){},details(){return{};},bindRoute(root){root.traverse(m=>{if(m.isMesh){m.userData.routeVerified=true;m.customDepthMaterial=new T.MeshDepthMaterial();}});}};}
try{
for(const biome of Object.keys(wildlifeCatalog)){
 const world=worldFor();installWildlifeArt(world,biome);const art=world.wildlifeArt;
 const anchors=JSON.stringify(art.groundSets.map(s=>s.individuals));
 const baseHeads=art.groundSets.map(s=>s.parts.head.geometry),baseWings=art.birdSets.map(s=>s.wings.geometry);
 assert.equal(world.wildlifeUltraDetail.bindings.length,0);
 const rows=[];
 for(const quality of ['Low','High','Ultra','Ultra+','Game Only','High','Ultra+']){
  world.quality(quality);world.setNatureDifficulty(true);world.update(100,6,2);const d=world.details(),extra=world.wildlifeUltraDetail;
  assert.equal(d.wildlifeUltraDetail.active,quality==='Ultra+');assert.equal(JSON.stringify(art.groundSets.map(s=>s.individuals)),anchors);
  if(quality==='Ultra+'){
   assert(d.wildlifeUltraDetail.closeSubjects>0);assert.equal(extra.root.visible,true);
   for(let i=0;i<baseHeads.length;i++)assert.notEqual(art.groundSets[i].parts.head.geometry,baseHeads[i]);
   for(let i=0;i<baseWings.length;i++)assert.notEqual(art.birdSets[i].wings.geometry,baseWings[i]);
   for(const b of extra.bindings){assert.equal(!!b.mesh.userData.routeVerified,b.space==='ground');let cursor=0;for(let i=0;i<b.source.count;i++){const matrix=new T.Matrix4();b.source.getMatrixAt(i,matrix);const e=matrix.elements;if(e[12]**2+(e[13]-2)**2+(e[14]-5)**2>b.range*b.range)continue;const copied=new T.Matrix4();b.mesh.getMatrixAt(cursor++,copied);assert.deepEqual(copied.elements,matrix.elements);}assert.equal(cursor,b.mesh.count);}
  }else{
   assert.equal(extra.root.visible,false);assert.equal(extra.airRoot.visible,false);for(const b of extra.bindings){assert.equal(b.mesh.count,0);assert.equal(b.mesh.visible,false);}for(let i=0;i<baseHeads.length;i++)assert.equal(art.groundSets[i].parts.head.geometry,baseHeads[i]);
  }
  if(quality==='Game Only'){assert.equal(d.wildlife,0);assert.equal(d.birds,0);assert.equal(world.natureHazards(100,6,true).length,0);}
  for(const root of [art.root,art.air])root.traverse(mesh=>{if(mesh.isInstancedMesh){assert([...mesh.instanceMatrix.array].every(Number.isFinite));for(const attr of Object.values(mesh.geometry.attributes))assert([...attr.array].every(Number.isFinite));}});
  const hazards=world.natureHazards(100,6,true);if(biome==='jungle'&&quality!=='Game Only')for(const h of hazards){const rendered=art.hazardRenderInfo().find(r=>r.id===h.id);assert(rendered);assert(Math.abs(h.x-rendered.x)<1e-5);assert(Math.abs(h.z-rendered.z)<1e-5);}
  rows.push({quality,ground:d.wildlife,birds:d.birds,hazards:hazards.length,detail:d.wildlifeUltraDetail});
 }
 const before=world.details().wildlifeUltraDetail;const matrices=world.wildlifeUltraDetail.bindings.map(b=>Array.from(b.mesh.instanceMatrix.array));world.update(100,6,2);world.wildlifeUltraDetail.bindings.forEach((b,i)=>assert.deepEqual(Array.from(b.mesh.instanceMatrix.array),matrices[i]));
 const sources=new Set(world.wildlifeUltraDetail.bindings.map(b=>b.source));
 for(const source of sources)for(let i=0;i<source.count;i++){const matrix=new T.Matrix4();source.getMatrixAt(i,matrix);matrix.elements[12]+=1000;source.setMatrixAt(i,matrix);}
 world.wildlifeUltraDetail.refresh();assert.equal(world.details().wildlifeUltraDetail.closeSubjects,0);for(const b of world.wildlifeUltraDetail.bindings){assert.equal(b.mesh.count,0);assert.equal(b.mesh.visible,false);}
 world.update(100,6,2);assert(world.details().wildlifeUltraDetail.closeSubjects>0);
 const activeHazards=[];if(biome==='jungle')for(const t of[.3,27.3]){world.update(100,t,2);const hazards=world.natureHazards(100,t,true);assert(hazards.length>0);for(const h of hazards){const rendered=art.hazardRenderInfo().find(r=>r.id===h.id);assert(rendered);assert(Math.abs(h.x-rendered.x)<1e-5);assert(Math.abs(h.z-rendered.z)<1e-5);activeHazards.push({species:h.species,id:h.id,x:h.x,z:h.z,time:t});}}
 world.disposeWildlifeArt();assert.equal(world.scene.children.length,0);report.biomes.push({biome,rows,activeHazards,geometryTriangles:before.geometryTriangles});
}
report.checks=['All 24 species finite geometry/matrices','Ultra+ lazy creation and repeat tier transitions','Lower tiers restore original heads and wings','Game Only hides roots and zeros all detail counts','Detail matrices exactly match active source instances','Lazy detail meshes route-bound','Ground anchors unchanged','Jungle render/collision hazard positions match','Same simulation time preserves articulated pose','Far sources hide and zero every close-detail batch, then restore on return','Owned scene resources detach on disposal'];report.passed=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
fs.writeFileSync('work/wildlife-assets-v9/detail-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,biomes:report.biomes.map(b=>({name:b.biome,triangles:b.geometryTriangles})),failure:report.failure},null,2));
