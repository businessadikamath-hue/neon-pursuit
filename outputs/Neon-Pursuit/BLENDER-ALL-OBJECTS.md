# Blender all-object asset pipeline

The package now ships one authored Blender asset library at `gallery/blender/hero-blender-ultraplus.glb` and the editable source scene at `gallery/blender/neon-pursuit-blender-cinematic.blend`.

The library contains 849 exported mesh objects covering:

- hero vehicle parts: body, inset doors, glazing, pillars, cabin, seats, wheels, brakes, lights, exhaust, mirrors and raised neon plate lettering;
- world objects: road slab, lane dividers, aggregate, ocean, shore, clouds and roadside rocks;
- nature objects: multiple tree species, branches, trunks, foliage and articulated gull parts.

When the game is served from a local HTTP host, the runtime reads the GLB with its built-in lightweight loader and replaces the black garage/player car with the Blender-authored 110-part hero. The diagnostic snapshot exposes `blenderAssets.status`, object count and category coverage. The other seven selectable cars and the recycled traffic fleet keep their existing authored runtime variants so the game remains responsive and collision-safe.

`Launch.cmd` continues to open the fully offline file build. Browsers intentionally block `fetch()` from `file://` pages, so that launch path reports a clean procedural fallback instead of a console error. To exercise the live GLB replacement, serve the `outputs/Neon-Pursuit` folder with any local HTTP server and open `index.html`; no network asset is requested.

The asset library is original project art. The package does not silently copy Sketchfab models or claim licensed manufacturer geometry. External models can be added later only after their license and redistribution terms are recorded beside the asset.
