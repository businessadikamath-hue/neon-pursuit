# Neon Pursuit v9 — verification

Recorded 2026-09-13; final runtime SHA-256 `32c5ee86784a55cef911072245243990c4794b2654f4db4d89d381c799bfe154`.

## Concrete visual changes

Twenty original Blender player/traffic bodies now use bounded continuous cross-sections, fitted roof/glazing/pillar surfaces and thinner panel gaps. Raised hood rods and duplicate sports-car arch hoops are removed. Paint/rubber normals and metal/light response are more restrained. Geometry, normals, canopy boundaries, batching, wheel attachment, collision dimensions, quality restoration and disposal were checked in component fixtures. The hero car now adds inset door skins, separate vertical and lower creases, hinge/handle hardware, a translucent cabin with modeled seats/dashboard/steering wheel, and a neon mock plate built from individually raised 5×7 glyph strokes with edge highlights and screws.

Trees have unequal branches, stronger taper, more varied leaf orientation and less regular grouping. Grass and litter have asymmetric shapes, mixed heights and gaps. Redundant geometry was reduced within the explicit presets; this is not automatic quality reduction. Wildlife has continuous species-family skull/muzzle and body contours, smaller seated eyes, revised horns and a less regular feather silhouette. Birds now carry batched beak, eye, tail and layered feather geometry that follows the animated wing transforms. Matched component renders identify the specific differences and remaining anatomical simplifications.

Daylight uses a single broad directional sun with cooler sky fill, less ground fill, adjusted exposure and tighter filtered-shadow coverage. The sky has layered cloud shading, a restrained sun/horizon glow, and a slow time-driven drift across multiple cloud scales. Asphalt now has irregular mineral grains in dark bitumen with correlated normal and roughness maps, including smoother sealed tar. Ultra+ adds individually instanced aggregate stones, worn lane edges and chipped reflective paint flecks. Longitudinal road wear now uses the correct plane coordinates. Terrain has periodic erosion detail and spatial color variation; distant islands have smoother geometry.

The coastal edge blends to sea level beyond the road while preserving road coordinates. Its normal/tangent transformation was checked against finite differences across 600 cases. Water and foam follow the curved boundary. Original long swells, paired approximate normals, a 512-pixel mipmapped wind-normal map, extra cross-direction wave bands, animated glints and broken cellular foam replace the more regular wave pattern. Wet shoreline sand is darker and less rough. Existing planar reflection resolutions and capture rates remain unchanged.

## Matched visual evidence

The full-game comparison has 17 before and 17 after captures at 1440×900. Scene seed, simulation pose/time, camera, car, biome and quality settings are fixed. High and Ultra+ driving/road views cover all four locations, with a coastal shore view. The actual game renderer and postprocessing are used. Frozen-frame HUD FPS values are not performance evidence. Component Blender/studio images are labeled separately from full-game captures.

GALLERY.html collects the before/after images and component evidence. Changes in pixels establish that the presentation changed; visual inspection and the accompanying descriptions support the narrower claims above. They do not provide an objective photorealism score.

## Gameplay, audio and interface

The eight-car automatic powertrain and original audio source are retained. Dry flat-road 0–180 mph is about 7.6–8.4 seconds and 0–200 mph is about 8.8–9.8 seconds. Ten seconds coasting from 200 leaves about 185 mph. These are authored game results, not manufacturer specifications. FAST-DRIVE.md lists each car and the actual graded-road measurements.

The final bundled regressions exercise assisted/unassisted curves, cruise and braking, impacts and repair, fatal crashes, near misses, police eligibility/catch/ram/escape, normal/red-light/crossing traffic, randomized routes, Zen suppression, pause and persistence. Geography-off suppression and an actual jungle animal collision are checked. Focus loss silences sound immediately even when the game frame callback is withheld; crash propulsion/RPM handling, Enter guard, independent sound controls and fullscreen are also tested.

Real-time audio checks cover all eight cars through acceleration to 200, ten seconds coasting, braking to zero and downshifts. Combustion upshift effects require powered acceleration; coast/brake/downshift effects remain suppressed. Tesla has no fake shifts. The four unchanged original 660-second ambience files play locally. Runtime errors, external HTTP requests and observed clipped samples are checked; component synthesis provenance is documented separately in AUDIO-SOURCES.md.

The final UI matrix records 844 passing checks, 20 biome/quality cases, 12 biome/time-of-day cases and all eight car panels. It includes Ultra+ warning/cancel/confirm, tier restoration, lazy geometry/route/depth bindings, wildlife transport, units/FPS controls, persistence, cache limits, finite transforms and offline loading.

## Sustained performance

Headless Edge at 1280×800 on the recorded device, Jungle, 180 mph cruise and Lane Assist, traffic/audio/geography penalties off. Each quality has six seconds warm-up and approximately 24 seconds measured native driving. No other game preview or Blender render runs during this measurement. The visible desktop window can use a different resolution and pixel scale.

| Quality | Observed native FPS | Median displayed FPS | Median callback ms | Dropped simulation seconds |
|---|---:|---:|---:|---:|
| Game Only | 113.34 | 120.0 | 3.80 | 0.000 |
| Low | 30.02 | 31.0 | 14.10 | 0.000 |
| High | 8.34 | 9.0 | 16.05 | 0.000 |
| Ultra | 5.19 | 5.0 | 17.10 | 0.042 |
| Ultra+ | 3.01 | 3.0 | 22.10 | 4.684 |

Device: `{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0", "viewport": [1280, 800], "devicePixelRatio": 1, "renderer": "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A8) Direct3D11 vs_5_0 ps_5_0, D3D11)", "vendor": "Google Inc. (Intel)"}`.

The FPS cap is a ceiling. A roughly 60 Hz browser cadence does not demonstrate a higher throughput ceiling. Heavy presets can be slow; the bounded catch-up loop may drop simulation time under larger stalls. Raw frame intervals, callbacks, sample counts, gameplay progression and screenshots are retained in the performance report.

## Blender cinematic evidence

The delivered `gallery/blender/neon-pursuit-blender-cinematic.blend` is an editable Blender 5.2.1 scene with the modeled car, cabin, doors, plate glyphs, wheels/brakes, shoreline, ocean, trees, rocks, clouds and high-detail gull assets. Its packed materials use the supplied 4K asphalt, sand and bark payloads plus 1K rock payloads; the source JPGs are retained in `assets-source/blender-pbr/`. A 1280×720 Cycles hero still and 48 1280×720 Eevee frames at 24 fps are included. The offline player was read back in Edge: its first frame loaded, advancing to frame 7 produced no page errors, and both installed and extracted game bundles passed the final driving/Ultra+ smoke. The cinematic is a Blender-rendered presentation asset; the interactive game remains the authored WebGL2 runtime described above.

## Quality pass 10

The final quality pass raises the actual Ultra+ render budget to 2× device-pixel supersampling and 4096² filtered shadows, and increases the terrain heightfield to 160×80 with a 96×64 displaced distant-hill mesh. Distant hills now use the same local scanned colour, normal and roughness payloads as the road, sand, snow and rock surfaces. The runtime car carries independently modeled neon plates on both faces, including raised per-stroke glyph relief, colored edge bars, screws and a dark recessed backing, so the plate remains legible from the following camera. The new surface pass keeps those maps live across recycled tiles and adds a small correlated strata response to textured terrain. The interface received a glass-surface pass with clearer focus states, layered shadows and restrained highlight glow.

The quality-pass smoke opened both the installed bundle and a fresh extraction of the final ZIP across all four biomes at Ultra+: 4096² shadows, 30–33 visible wildlife subjects, 48 birds, 671,880–1,198,562 modeled leaves, and 32,165–272,492 active grass strands depending on the biome. Both runs completed with zero page errors, zero console errors and zero external HTTP requests. The screenshots in `work/graphics-v9/quality-pass-all` and `work/quality-pass-smoke` are additional actual-render evidence; their frozen-frame FPS labels are not performance claims.

## Limits and delivery

V9 is an original stylized refinement. It is not indistinguishable from a real photograph or a commercial Forza scene. The body shapes, lamps/interiors, plant repetition, simplified wildlife articulation, glass sorting and coastal shader approximations remain visible. The runtime uses rasterization, filtered shadows, local environment probes, planar water reflections and screen-space/depth atmosphere; it does not implement full-scene path tracing, general global illumination or scanned/licensed manufacturer models. Engine sounds remain original approximations rather than authentic recordings.

Installed runtime read-back: **True**. Installed and independently extracted offline driving/audio/Ultra+ launch checks: **True**.
The previous verified v8 folder is preserved as `Neon-Pursuit-before-v9`.
Final packaging validates the manifest, ZIP CRC and every archived file against the installed bytes. Archive hashes are recorded outside the archive to avoid self-reference. Visible launch details and any launcher fallback are recorded in the external delivery report.
