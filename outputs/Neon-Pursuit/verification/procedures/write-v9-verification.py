from pathlib import Path
import json,hashlib,datetime,shutil
root=Path(__file__).resolve().parent.parent
release=root/'work/release-v9';stage=root/'work/stage-v9'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
game_hash=sha(release/'game.js')
matrix=load(root/'work/qa-v9-matrix.json');perf=load(root/'work/efficiency-v9/sustained-report.json')
core=[load(stage/n) for n in ['DRIVING-V9-QA.json','EXTRA-V9-QA.json','LIFECYCLE-V9-QA.json','INTEGRATED-AUDIO-V9-QA.json']]
assert matrix['passed'] and perf['passed'] and all(r.get('passed',True) for r in core)
assert all(r['gameSHA256']==game_hash for r in core)
assert matrix['files']['game.js']['sha256']==game_hash==perf['gameSha256']
before=load(root/'work/graphics-v9/before/report.json');after=load(root/'work/graphics-v9/after/report.json')
assert before['passed'] and after['passed'] and after['gameSHA256']==game_hash
assert before['gameSHA256']=='05ce5ad0f0b0eb4a4ae96c677c0c8f58644d03ad05420b16324418ea48e384ca'
installed_path=root/'outputs/Neon-Pursuit';install_path=root/'work/install-v9-results.json';smoke_path=root/'work/package-v9-results.json'
installed=install_path.is_file() and load(install_path).get('gameSHA256')==game_hash and sha(installed_path/'game.js')==game_hash
smoke=load(smoke_path) if smoke_path.is_file() else []
smoke_ok=len(smoke)==2 and all(r.get('version')=='9.0.0' and r.get('gameSHA256')==game_hash and r.get('ultra',{}).get('quality')=='Ultra+' and not r.get('errors') and not r.get('external') for r in smoke)
lines=['# Neon Pursuit v9 — verification','',f"Recorded {datetime.datetime.now(datetime.timezone.utc).date()}; final runtime SHA-256 `{game_hash}`.",'',
'## Concrete visual changes','',
'Twenty original Blender player/traffic bodies now use bounded continuous cross-sections, fitted roof/glazing/pillar surfaces and thinner panel gaps. Raised hood rods and duplicate sports-car arch hoops are removed. Paint/rubber normals and metal/light response are more restrained. Geometry, normals, canopy boundaries, batching, wheel attachment, collision dimensions, quality restoration and disposal were checked in component fixtures.','',
'Trees have unequal branches, stronger taper, more varied leaf orientation and less regular grouping. Grass and litter have asymmetric shapes, mixed heights and gaps. Redundant geometry was reduced within the explicit presets; this is not automatic quality reduction. Wildlife has continuous species-family skull/muzzle and body contours, smaller seated eyes, revised horns and a less regular feather silhouette. Matched component renders identify the specific differences and remaining anatomical simplifications.','',
'Daylight uses a single broad directional sun with cooler sky fill, less ground fill, adjusted exposure and tighter filtered-shadow coverage. The sky has layered cloud shading and a restrained sun/horizon glow. Asphalt now has irregular mineral grains in dark bitumen with correlated normal and roughness maps, including smoother sealed tar. Longitudinal road wear now uses the correct plane coordinates. Terrain has periodic erosion detail and spatial color variation; distant islands have smoother geometry.','',
'The coastal edge blends to sea level beyond the road while preserving road coordinates. Its normal/tangent transformation was checked against finite differences across 600 cases. Water and foam follow the curved boundary. Original long swells, paired approximate normals, a 512-pixel mipmapped wind-normal map and broken cellular foam replace the more regular wave pattern. Wet shoreline sand is darker and less rough. Existing planar reflection resolutions and capture rates remain unchanged.','',
'## Matched visual evidence','',
f"The full-game comparison has {len(before['cases'])} before and {len(after['cases'])} after captures at 1440×900. Scene seed, simulation pose/time, camera, car, biome and quality settings are fixed. High and Ultra+ driving/road views cover all four locations, with a coastal shore view. The actual game renderer and postprocessing are used. Frozen-frame HUD FPS values are not performance evidence. Component Blender/studio images are labeled separately from full-game captures.",'',
'GALLERY.html collects the before/after images and component evidence. Changes in pixels establish that the presentation changed; visual inspection and the accompanying descriptions support the narrower claims above. They do not provide an objective photorealism score.','',
'## Gameplay, audio and interface','',
'The eight-car automatic powertrain and original audio source are retained. Dry flat-road 0–180 mph is about 7.6–8.4 seconds and 0–200 mph is about 8.8–9.8 seconds. Ten seconds coasting from 200 leaves about 185 mph. These are authored game results, not manufacturer specifications. FAST-DRIVE.md lists each car and the actual graded-road measurements.','',
'The final bundled regressions exercise assisted/unassisted curves, cruise and braking, impacts and repair, fatal crashes, near misses, police eligibility/catch/ram/escape, normal/red-light/crossing traffic, randomized routes, Zen suppression, pause and persistence. Geography-off suppression and an actual jungle animal collision are checked. Focus loss silences sound immediately even when the game frame callback is withheld; crash propulsion/RPM handling, Enter guard, independent sound controls and fullscreen are also tested.','',
'Real-time audio checks cover all eight cars through acceleration to 200, ten seconds coasting, braking to zero and downshifts. Combustion upshift effects require powered acceleration; coast/brake/downshift effects remain suppressed. Tesla has no fake shifts. The four unchanged original 660-second ambience files play locally. Runtime errors, external HTTP requests and observed clipped samples are checked; component synthesis provenance is documented separately in AUDIO-SOURCES.md.','',
f"The final UI matrix records {len(matrix['checks'])} passing checks, {len(matrix['combinations'])} biome/quality cases, {len(matrix['lightingCases'])} biome/time-of-day cases and all eight car panels. It includes Ultra+ warning/cancel/confirm, tier restoration, lazy geometry/route/depth bindings, wildlife transport, units/FPS controls, persistence, cache limits, finite transforms and offline loading.",'',
'## Sustained performance','',
'Headless Edge at 1280×800 on the recorded device, Jungle, 180 mph cruise and Lane Assist, traffic/audio/geography penalties off. Each quality has six seconds warm-up and approximately 24 seconds measured native driving. No other game preview or Blender render runs during this measurement. The visible desktop window can use a different resolution and pixel scale.','',
'| Quality | Observed native FPS | Median displayed FPS | Median callback ms | Dropped simulation seconds |','|---|---:|---:|---:|---:|']
for run in perf['runs']:
 lines.append(f"| {run['quality']} | {run['observedNativeFps']:.2f} | {run['medianReportedFps']:.1f} | {run['medianFullCallbackCpuMs']:.2f} | {run['droppedSeconds']:.3f} |")
lines+=['',f"Device: `{json.dumps(perf.get('device',{}),ensure_ascii=False)}`.",'',
'The FPS cap is a ceiling. A roughly 60 Hz browser cadence does not demonstrate a higher throughput ceiling. Heavy presets can be slow; the bounded catch-up loop may drop simulation time under larger stalls. Raw frame intervals, callbacks, sample counts, gameplay progression and screenshots are retained in the performance report.','',
'## Limits and delivery','',
'V9 is an original stylized refinement. It is not indistinguishable from a real photograph or a commercial Forza scene. The body shapes, lamps/interiors, plant repetition, simplified wildlife articulation, glass sorting and coastal shader approximations remain visible. The runtime uses rasterization, filtered shadows, local environment probes, planar water reflections and screen-space/depth atmosphere; it does not implement full-scene path tracing, general global illumination or scanned/licensed manufacturer models. Engine sounds remain original approximations rather than authentic recordings.','',
f"Installed runtime read-back: **{installed}**. Installed and independently extracted offline driving/audio/Ultra+ launch checks: **{smoke_ok}**.",
('The previous verified v8 folder and archive are preserved as Neon-Pursuit-before-v9 and Neon-Pursuit-before-v9.zip.' if installed else 'The verified v8 installation remains in place until the candidate passes offline package checks.'),
'Final packaging validates the manifest, ZIP CRC and every archived file against the installed bytes. Archive hashes are recorded outside the archive to avoid self-reference. Visible launch details and any launcher fallback are recorded in the external delivery report.']
text='\n'.join(lines)+'\n';(release/'VERIFICATION.md').write_text(text,encoding='utf-8')
if installed:(installed_path/'VERIFICATION.md').write_text(text,encoding='utf-8')
print(json.dumps({'report':str(release/'VERIFICATION.md'),'installed':installed,'smokePassed':smoke_ok,'matrixChecks':len(matrix['checks'])}))
