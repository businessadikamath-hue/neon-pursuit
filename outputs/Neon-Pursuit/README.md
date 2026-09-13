# Neon Pursuit — Worlds 9.0.0

An offline highway driving game with eight cars, four environments, very fast acceleration and gradual coasting.

## Play

Open **Launch.cmd** to play in an Edge app window. **Install.cmd** creates or refreshes the **Neon Pursuit** Start Menu shortcut. Keep the folder together and rerun the installer if you move it. The game needs no server, development tools, account or internet connection.

- **↑** accelerates hard; release it to coast gently. **↓** brakes to a full stop.
- **← / →** steer. **Lane Assist** holds your lane through curves and selects the nearest lane after a manual lane change. With it off, curves push the car sideways and require steering corrections.
- **C** toggles Cruise Control at your current speed. Braking cancels cruise. Zen also offers a pre-start cruise checkbox.
- **P / Escape** pauses; **M** toggles vehicle audio. Use **Fullscreen** for the full display.
- Choose a car in the garage dropdown or with the mouse wheel over the garage. Return to the garage to change car, environment or mode. Time of day, graphics, assists and sound remain adjustable while paused.

## Strong acceleration, gentle coasting

Every car pulls hard through **180–200 mph**, then tapers toward its **230–265 mph** game limit. Healthy, dry, flat-road tests including automatic shifts reach 180 in **7.63–8.42 seconds** and 200 in **8.76–9.78 seconds**. After ten seconds coasting from 200, speed remains **185–186 mph**. Hills, surface grip, damage and drafting affect driving results.

The garage uses real counterpart names. The visible bodies are **original stylized designs**, with actual Blender-generated player and traffic body meshes; they are not manufacturer replicas. Published real-car specifications and source links appear in a separate expandable panel. The game's boosted acceleration is explicitly labeled **Arcade fast drive**.

Each car trades acceleration, top speed, handling, braking, stability and Strength. Strength changes impact damage and is a game rating, not a real-world safety rating. The six authored capability ratings share a 42-point budget; this is a balancing guide, not a guarantee of equal competitive results. Drift ease is shown separately.

## Four locations

Tree species and growth patterns are chosen automatically and consistently for each location.

| Location | Road | Geographical difficulty |
|---|---|---|
| Coastline | Asphalt | Easy: open coastal road |
| Desert | Rocky aggregate | Moderate: reduced rough-road grip |
| Jungle | Dirt | Hard: reduced grip and crossing animals |
| Tundra | Ice | Hard: low grip and longer skids |

**Geographical nature difficulty** controls these surface penalties and jungle animal crossings. Turning it off restores normal road grip and removes animal collision hazards. Road edges, other vehicles, hills and curves still matter.

The scenery combines local Poly Haven CC0 PBR scans for asphalt, earth, rock, sand, grass and bark with an original generated feather texture, Blender-modeled tree roots/trunks and weathered rocks, modeled twig sprays, terrain-grounded understory, animated wildlife, broad directional sunlight with sky/ground fill, contact shadows, reflections and atmospheric depth. The source scans are embedded as local image payloads, so the game makes no network request while playing. Road aggregate is small and subdued, with separate color, roughness and normal variation. Jungle has denser organized groves, longer canopy branches and several layers of smaller plants. The road remains a continuous curved route, with randomized intersection locations and signal phases on each run; it has no branching free-roam streets.

## Regular and Zen

**Regular** includes traffic, speed-dependent impact damage, gradual repair and police encounters. Road-edge or vehicle contact causes a flash, vibration, speed loss and a crash sound when vehicle audio is enabled. High-speed impacts can wreck the car and show a brief side-view crash scene. After four seconds without damage, body health gradually repairs at 2.4 points per second.

Police only begin a pursuit **above 100 mph**, at varying route positions. During the alert, stay above **150 mph for ten seconds**. Spending more than one continuous second at 150 or below leads to capture. The world stops at the actual catch location while the camera moves to the side and the police car rams the player into a short drift.

**Zen** removes health loss and police. Its optional **Disable all traffic** setting clears ordinary and crossing traffic. Edge contact still slows and shakes the car. Settings and separate Regular/Zen records persist locally.

## Graphics

**Game Only** keeps the road, player, basic traffic and essential signs/signals, with scenery, wildlife, weather, water, environmental reflections and shadows disabled. **Low**, **High**, **Ultra** and **Ultra+** add progressively more detail. The graphics selector supports the mouse wheel.

**Ultra+** adds a dedicated detail tier: sculpted tire tread and brake parts, finer interiors and light optics, cambered nearby leaves and needle bundles, denser ground/shore objects, higher-resolution surface maps, and fitted wildlife face/feather/fur detail. Lower presets retain their simpler geometry and material choices.

**Automatic quality reduction is disabled.** Ultra+ displays a warning before selection because its dense scenery, reflections and supersampling can be very expensive. The FPS cap is a ceiling, not a promised frame rate. Read **VERIFICATION.md** for measured performance on the test computer. Normal distance-based vegetation detail still operates within each selected preset.

The current quality pass gives Ultra+ a 4096² shadow map, a 2× device-pixel ceiling, a 160×80 terrain heightfield and a 96×64 displaced distant-hill mesh. Scanned surface maps reach the hills as well as the road, shore and roadside aggregate. The following camera sees a second modeled neon plate with individually raised glyph strokes, colored edge bars, screws and recessed backing.

## V9 visual refinement

All twenty player/traffic body meshes now use smoother bounded cross-sections, fitted roofs and glazing, thinner panel gaps, and more restrained paint, rubber, metal and light response. Original Blender sources and matched v8/v9 studio images are included.

Daylight uses one broad sun with cooler sky fill and a more restrained ground contribution. Asphalt has irregular mineral aggregate in a darker bitumen base, with linked height and roughness; wet shoreline sand, terrain erosion, distant islands and layered cloud shading are refined. The coast blends toward sea level outside the road, and the ocean edge/foam follow the shore through road curves. Mipmapped wind ripples reduce the old regular wave pattern while original swells and broken foam add coastal motion.

Branches and grass use less regular proportions and grouping, with reduced redundant geometry. Wildlife has more continuous skull, muzzle, body and feather shapes and smaller fitted eyes. These refinements remain stylized original art. They do not establish photographic realism, scanned anatomy, licensed manufacturer replicas or Forza-level presentation.

GALLERY.html contains matched component and full-game comparisons. Full-game matching fixes camera, scene seed, pose and simulation time; its displayed frozen-frame FPS is not a benchmark. Performance is measured separately while the game is actually driving.

## Blender Ultra+ cinematic

The package now includes a dedicated Blender 5.2.1 scene under **gallery/blender/**. It combines the original Blender body mesh with modeled roof/pillars, transparent cabin glazing, seats, dashboard, door skins, seams, hinges, wheels, brakes, raised neon plate lettering, road aggregate, ocean, trees, rocks and a fully modeled gull. The road, shoreline sand, tree bark and hero stones use the embedded Poly Haven colour, roughness and normal payloads inside the editable scene; the source JPG payloads are also in **assets-source/blender-pbr/**. Cycles renders the 1280×720 hero still; Eevee renders a 48-frame keyed orbit as a 1280×720 lossless PNG sequence, and **gallery/blender/index.html** plays it offline. The `.blend` file and compact exported `hero-blender-ultraplus.glb` are included for inspection or further rendering.

## Sound

Vehicle audio uses original combustion-cycle engine synthesis with separate exhaust, intake, turbo and mechanical layers for each engine family. Accelerator-held upshifts have a short torque interruption; coasting, braking, deceleration and downshifts suppress the distinct shift sound and sound cut. Tesla uses continuous motor tones and no fake shifts. Continuous engine pitch can still change with real downshifts. Impacts, traffic and sirens remain active. The separate **Nature soundscape** control plays an original eleven-minute stereo ambience recording for each location, starting at a randomized offset with crossfades and additional varied wildlife events. These are locally generated procedural recordings, not field recordings or copied commercial sounds. All required sound files ship in the audio folder.

Browser audio begins after a user gesture. Nature and vehicle audio have independent controls. Long recordings reduce short-loop repetition, but repeated motifs can still be audible.

## Source, verification and limits

- **VERIFICATION.md** describes current gameplay, audio, rendering, performance and packaging checks.
- **GALLERY.html** shows actual screenshots from the updated game.
- **FAST-DRIVE.md** records acceleration/coasting measurements.
- **REAL-CAR-SPECS.md** documents published counterpart facts and estimation boundaries.
- **AUDIO-SOURCES.md** documents primary engine references and original sound provenance.
- **source/** contains editable game modules and its rebuild manifest.
- **assets-source/** contains the original editable Blender file and generation source.

The game uses authored stylized vehicle, scenery and wildlife geometry, local CC0 material scans, and simplified vehicle/wildlife behavior. It does not reproduce the photorealism, licensed models, complete car physics or open world of a commercial racing simulator. Performance varies substantially by location and quality, especially in dense Jungle scenes.

