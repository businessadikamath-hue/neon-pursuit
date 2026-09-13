# V9 bounded vehicle component acceptance

Status: source frozen and component checks passed. The installed v8 build remains untouched; v9 full-game QA, performance and delivery remain the main task's responsibility.

Changed runtime files: engine-v9/models.js, vehicleDetailTier.js, blenderVehicleBodiesV8.js, and new vehicleCanopyV9.js. heroVehicleParts.js is retained unchanged. All factories, IDs, reference names, collision dimensions, wheel animation groups, police flash materials, quality/tier diagnostics, route-compatible BufferGeometry and disposal ownership remain compatible. Physics is byte-identical to the installed v8 source (8e453e393a93d69d52e898abdb53a3cc53942b886a779cd914f7181b0908148c). Source and evidence hashes are in source-hashes.json.

## Visible outcome

All 20 bodies now use bounded, continuous-tangent cross-sections with their existing modeled arch and fascia recesses. Large hood-wire overlays and sports-car arch hoops are removed, with thinner fitted panel gaps. Roof, pillar and glazing patches share boundaries instead of wrapping the entire cabin in a rounded loft. Paint/rubber normals are subtler, trim is less metallic, brake/alloy surfaces are rougher, and lights use tone-mapped emission. These are concrete surface/material improvements; the eight silhouettes and twelve traffic body types remain identifiable original approximations.

The first cubic trial exposed lower-edge overshoot and was rejected. The final Hermite implementation removes that overshoot without adding ring density. A dedicated canopy test exposed a tiny inverted strip where rear glazing met the body; the final profile bounds and proportional bulge fix it. The final gallery and hashes supersede the intermediate captures, which were overwritten.

## Evidence and results

- Actual Blender 4.5.5 LTS generated 20 editable bodies, 8570–10776 triangles each, using the same 48 samples per ring. See body-build-report.json, body-validation-report.json and the table below.
- Final Cycles CPU component proof: blender-v9-body-proof.png and neon-v9-body-proof.blend, 1300 × 900, 32 samples, four render threads, 73.14 seconds recorded. The body-module hash is checked against the rendered report. This is an actual body-component render; complete cars are the browser galleries.
- Final gallery/browser-report.json: 20 captures, zero page errors, identical v8/v9 camera/light/environment/viewport/settings. All 8 players and 12 traffic types inspected from front/rear; black and silver close, traffic close, and black rear chase-distance pairs inspected. The original v8 six matching PNGs reproduce byte-for-byte (baseline-reproduction.json).
- All four final static batching pairs pass: maximum normalized mean absolute difference 8.556230569e-7, maximum fraction of pixels with >2/255 channel change 1.630434783e-5 (0.001630%). Both are below 0.005. These limits apply to batching; intended v8-to-v9 art edits are compared separately.
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
| black | 6762 | 10668 |
| silver | 6219 | 10100 |
| red | 6795 | 10776 |
| rally | 5371 | 8570 |
| muscle | 6193 | 10096 |
| roadster | 6441 | 10304 |
| electric | 6726 | 10668 |
| safari | 5523 | 8684 |
| traffic0 | 5712 | 9248 |
| traffic1 | 5691 | 9168 |
| traffic2 | 5694 | 9220 |
| traffic3 | 5934 | 9208 |
| traffic4 | 5667 | 9188 |
| traffic5 | 5563 | 9044 |
| traffic6 | 5861 | 9186 |
| traffic7 | 5688 | 9140 |
| traffic8 | 5725 | 9240 |
| traffic9 | 5516 | 8960 |
| traffic10 | 5723 | 9244 |
| traffic11 | 5663 | 9176 |
