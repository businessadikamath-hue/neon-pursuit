import * as T from 'three';
import * as before from '../engine/wildlifeArt.js';
import * as after from '../engine-v9/wildlifeArt.js';
import {blenderWildlife8 as bank} from '../engine-v9/blenderWildlife8.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out={passed:false,subjects:[],skulls:[],behavior:[],errors:[]};
function equalArray(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
function hazardView(rows){return rows.map(({mesh,...value})=>value);}
function geometry(g){if(!g)return null;g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3()),p=g.attributes.position,n=g.attributes.normal;assert(p.array.every(Number.isFinite)&&n.array.every(Number.isFinite));let unitError=0,zeroNormals=0;for(let i=0;i<n.count;i++){const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(length<1e-8)zeroNormals++;else unitError=Math.max(unitError,Math.abs(length-1));}assert(unitError<.002);return {triangles:(g.index?.count??p.count)/3,size:size.toArray(),maxNormalLengthError:unitError,zeroNormals};}
function stub(){return{scene:new T.Scene(),tiles:Array.from({length:5},(_,i)=>{const t=new T.Group();t.userData={routeBlock:i-1,terrainHeight:(x,z)=>Math.sin(z*.013)*.05};return t;}),fauna:[],birdBatches:[],quality(){},update(){},details(){return{};},bindRoute(g){g.traverse(o=>{if(o.isMesh){o.material.customProgramCacheKey=()=>':route-art-';o.customDepthMaterial=new T.MeshDepthMaterial();}});}};}
try{
 assert.deepEqual(after.wildlifeCatalog,before.wildlifeCatalog);
 if(!process.env.MORPH_SKIP_SUBJECTS)for(const [biome,cat]of Object.entries(after.wildlifeCatalog).filter(([name])=>!process.env.MORPH_BIOME||name===process.env.MORPH_BIOME))for(const type of['ground','birds'])for(const name of cat[type].filter(value=>!process.env.MORPH_NAME||value===process.env.MORPH_NAME)){ global.gc?.();
  const fn=type==='ground'?'buildWildlifeModel':'buildBirdModel',a=before[fn](name,{ultra:true}),b=after[fn](name,{ultra:true});assert.deepEqual(b.config,a.config);if(type==='ground'){assert.deepEqual(b.headPivot,a.headPivot);assert.deepEqual(b.tailPivot,a.tailPivot);}
  const keys=type==='ground'?['body','head','leg','tail','fur']:['body','wing','leftWing'],ga=type==='ground'?a.parts:a,gb=type==='ground'?b.parts:b,row={biome,type,name,parts:{}};for(const key of keys)row.parts[key]={before:geometry(ga[key]),after:geometry(gb[key])};for(const key of['eyes','wet','fur'])geometry(b.detail?.[key]);out.subjects.push(row);
 }
 for(const [name,g]of Object.entries(bank).filter(([k])=>k.startsWith('skull-'))){let volume=0,minArea=Infinity;for(let j=0;j<g.i.length;j+=3){const v=[0,1,2].map(k=>new T.Vector3(...g.p.slice(g.i[j+k]*3,g.i[j+k]*3+3))),cross=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));minArea=Math.min(minArea,cross.length()*.5);volume+=v[0].dot(v[1].clone().cross(v[2]))/6;}assert(volume>0);assert(minArea>0);out.skulls.push({name,triangles:g.i.length/3,vertices:g.p.length/3,signedVolume:volume,minimumTriangleArea:minArea});}
 if(!process.env.MORPH_SKIP_BEHAVIOR)for(const biome of Object.keys(after.wildlifeCatalog).filter(name=>!process.env.MORPH_BIOME||name===process.env.MORPH_BIOME)){ global.gc?.();
  const a=stub(),b=stub();before.installWildlifeArt(a,biome);after.installWildlifeArt(b,biome);
  assert.deepEqual(b.wildlifeArt.groundSets.map(s=>s.individuals.map(({sample,...v})=>v)),a.wildlifeArt.groundSets.map(s=>s.individuals.map(({sample,...v})=>v)));
  for(const quality of['Low','High','Ultra','Ultra+','Game Only'])for(const [distance,time]of[[100,.3],[100,27.3],[2873,123.45]]){
   for(const w of[a,b]){w.quality(quality);w.setNatureDifficulty(true);w.update(distance,time,2);}
   assert.deepEqual(b.natureHazards(distance,time,true),a.natureHazards(distance,time,true));assert.deepEqual(hazardView(b.wildlifeArt.hazardRenderInfo()),hazardView(a.wildlifeArt.hazardRenderInfo()));
   for(let s=0;s<3;s++){for(const key of Object.keys(a.wildlifeArt.groundSets[s].parts)){const x=a.wildlifeArt.groundSets[s].parts[key],y=b.wildlifeArt.groundSets[s].parts[key];assert.equal(y.count,x.count);assert.ok(equalArray(y.instanceMatrix.array,x.instanceMatrix.array));}for(const key of['body','wings','leftWings']){const x=a.wildlifeArt.birdSets[s][key],y=b.wildlifeArt.birdSets[s][key];assert.equal(y.count,x.count);assert.ok(equalArray(y.instanceMatrix.array,x.instanceMatrix.array));}}
   out.behavior.push({biome,quality,distance,time,identicalSourceTransforms:true,identicalHazards:true});
  }
  a.disposeWildlifeArt();b.disposeWildlifeArt();assert.equal(a.scene.children.length+b.scene.children.length,0);global.gc?.();
 }
 out.passed=true;
}catch(e){out.errors.push(e.stack);process.exitCode=1;}
fs.writeFileSync('work/wildlife-assets-v9/morphology-qa.json',JSON.stringify(out,null,2));console.log(JSON.stringify({passed:out.passed,subjects:out.subjects.length,skulls:out.skulls.length,behaviorCases:out.behavior.length,errors:out.errors},null,2));

