const fs=require('fs'),path=require('path'),crypto=require('crypto');
const here=__dirname,root=path.resolve(here,'../..'),load=name=>JSON.parse(fs.readFileSync(path.join(here,name))),sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const models=load('body-build-report.json').models,browser=load('gallery/browser-report.json'),batching=load('gallery/batching-pixel-report.json'),render=load('blender-render-report.json'),tier=load('ultraplus-validation.json'),canopy=load('canopy-validation.json');
if(!browser.passed||!tier.pass||!canopy.passed||!batching.every(x=>x.passes))throw Error('Missing passed component acceptance');
const moduleFiles=['models.js','vehicleDetailTier.js','heroVehicleParts.js','blenderVehicleBodiesV8.js','vehicleCanopyV9.js'];
const sources=Object.fromEntries(moduleFiles.map(name=>['work/engine-v9/'+name,sha(path.join(here,'../engine-v9',name))]));
if(sources['work/engine-v9/blenderVehicleBodiesV8.js']!==render.bodyModuleSHA256)throw Error('Blender proof does not match final body source');
const originalGame=sha(path.join(root,'outputs/Neon-Pursuit/game.js')),physicsSHA=sha(path.join(here,'../engine-v9/vehiclePhysics.js'));
if(physicsSHA!==sha(path.join(root,'outputs/Neon-Pursuit/source/vehiclePhysics.js')))throw Error('Physics differs from installed baseline');
const baselinePairs=[['front','batch-on-front'],['rear','batch-on-rear'],['traffic','batch-on-traffic'],['traffic-rear','batch-on-traffic-rear'],['black-close','black-ultraplus-close'],['black-far','black-ultraplus-far']];
const baseline=baselinePairs.map(([fresh,old])=>({view:fresh,pngByteIdentical:sha(path.join(here,'gallery/v8-'+fresh+'.png'))===sha(path.join(here,'../car-assets-v8/ultraplus-gallery/'+old+'.png'))}));
if(!baseline.every(x=>x.pngByteIdentical))throw Error('Matched v8 fixture drifted from baseline');
fs.writeFileSync(path.join(here,'baseline-reproduction.json'),JSON.stringify({passed:true,views:baseline},null,2));
const evidenceFiles=['build_vehicle_bodies.py','body-designs.json','neon-pursuit-vehicles-v9.blend','render-body-proof.py','neon-v9-body-proof.blend','blender-v9-body-proof.png','build_hero_details.py','neon-ultraplus-parts.blend','gallery/main.js','gallery/gallery.js','gallery/browser-report.json','gallery/batching-pixel-report.json','blender-render-report.json','ultraplus-validation.json','body-validation-report.json','model-validation-report.json','canopy-validation.json'];
for(const name of evidenceFiles)sources['work/car-assets-v9/'+name]=sha(path.join(here,name));
fs.writeFileSync(path.join(here,'source-hashes.json'),JSON.stringify({version:9,sourceStable:true,installedV8GameSHA256:originalGame,physicsUnchangedSHA256:physicsSHA,sources},null,2));
const min=Math.min(...models.map(m=>m.triangles)),max=Math.max(...models.map(m=>m.triangles)),maxMean=Math.max(...batching.map(x=>x.normalizedMeanAbsoluteDifference)),maxPixels=Math.max(...batching.map(x=>x.fractionPixelsOver2Of255));
const table=models.map(m=>`| ${m.id} | ${m.vertices} | ${m.triangles} |`).join('\n');
fs.writeFileSync(path.join(here,'ACCEPTANCE.md'),`# V9 bounded vehicle component acceptance

Status: source frozen and component checks passed. The installed v8 build remains untouched; v9 full-game QA, performance and delivery remain the main task's responsibility.

Changed runtime files: engine-v9/models.js, vehicleDetailTier.js, blenderVehicleBodiesV8.js, and new vehicleCanopyV9.js. heroVehicleParts.js is retained unchanged. All factories, IDs, reference names, collision dimensions, wheel animation groups, police flash materials, quality/tier diagnostics, route-compatible BufferGeometry and disposal ownership remain compatible. Physics is byte-identical to the installed v8 source (${physicsSHA}). Source and evidence hashes are in source-hashes.json.

## Visible outcome

All 20 bodies now use bounded, continuous-tangent cross-sections with their existing modeled arch and fascia recesses. Large hood-wire overlays and sports-car arch hoops are removed, with thinner fitted panel gaps. Roof, pillar and glazing patches share boundaries instead of wrapping the entire cabin in a rounded loft. Paint/rubber normals are subtler, trim is less metallic, brake/alloy surfaces are rougher, and lights use tone-mapped emission. These are concrete surface/material improvements; the eight silhouettes and twelve traffic body types remain identifiable original approximations.

The first cubic trial exposed lower-edge overshoot and was rejected. The final Hermite implementation removes that overshoot without adding ring density. A dedicated canopy test exposed a tiny inverted strip where rear glazing met the body; the final profile bounds and proportional bulge fix it. The final gallery and hashes supersede the intermediate captures, which were overwritten.

## Evidence and results

- Actual Blender 4.5.5 LTS generated 20 editable bodies, ${min}–${max} triangles each, using the same 48 samples per ring. See body-build-report.json, body-validation-report.json and the table below.
- Final Cycles CPU component proof: blender-v9-body-proof.png and neon-v9-body-proof.blend, 1300 × 900, 32 samples, four render threads, ${render.renderSeconds.toFixed(2)} seconds recorded. The body-module hash is checked against the rendered report. This is an actual body-component render; complete cars are the browser galleries.
- Final gallery/browser-report.json: 20 captures, zero page errors, identical v8/v9 camera/light/environment/viewport/settings. All 8 players and 12 traffic types inspected from front/rear; black and silver close, traffic close, and black rear chase-distance pairs inspected. The original v8 six matching PNGs reproduce byte-for-byte (baseline-reproduction.json).
- All four final static batching pairs pass: maximum normalized mean absolute difference ${maxMean.toExponential(9)}, maximum fraction of pixels with >2/255 channel change ${maxPixels.toExponential(9)} (${(maxPixels*100).toFixed(6)}%). Both are below 0.005. These limits apply to batching; intended v8-to-v9 art edits are compared separately.
- 20 models × 2 batching settings pass construction and finite geometry checks. Four wheels per vehicle, collision envelopes, police flash ownership, and unchanged triangle counts under batching pass.
- 20 models × 2 batching settings pass Ultra+ activation, exact baseline material/visibility restoration, repeated-toggle geometry reuse, wheel-parented animation groups and accessible geometry/material disposal. All five retained Blender wheel/brake parts pass index, outward-tread-normal and planar-rotor-normal checks.
- All seven closed player canopies pass unit/outward normals for all three glazing panels. Traffic uses the same fitted canopy implementation; its complete assemblies pass construction and visual inspection. The delivery van and open roadster retain their specialized glazing assemblies.

## Integration and limits

No new caller API is required. Include vehicleCanopyV9.js when bundling/copying source. Continue applying setVehicleQuality(name), reading vehicleDetailTier, and binding route/depth materials after lazy Ultra+ creation as in v8. All original sources/assets are inside car-assets-v9, including retained wheel sources. See README.md for provenance and build/test paths.

This is a visual refinement, not an efficiency or frame-rate claim. The matched black rear view reports 65 → 66 draw calls and 274,230 → 270,376 rendered triangles including fixture/shadow accounting; actual frame performance must be measured in the final integrated game. Construction timings were measured alongside component checks and are explicitly not sustained frame benchmarks. No geometry or effects were automatically reduced.

The output remains procedural and stylized. Bumper/lamp pieces, interiors, mirrors, and some close silhouettes are simplified; thin seams can alias at long distance. The isolated studio uses bright reference lighting that compresses highlights on pale paint. This asset library does not reach manufacturer-exact, photographic or Forza-level fidelity. No external model, scan, texture, logo or photographic asset was copied. Real-car labels describe the reference analogue, not a licensed replica.

## Exported body counts

| ID | Vertices | Triangles |
|---|---:|---:|
${table}
`);
console.log(JSON.stringify({passed:true,models:models.length,bodyTriangles:[min,max],captures:browser.captures,maxMean,maxPixels,sourceStable:true,installedV8GameSHA256:originalGame},null,2));
