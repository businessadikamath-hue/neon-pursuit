# Original long-form audio — v7 verification

Four newly generated original recordings are included. Each delivered MP3 decodes to exactly **660.0 seconds (11 minutes)**. They are procedural soundscapes, not downloaded field recordings, commercial music, or recordings of real vehicle engines. No third-party audio was used.

| Biome | Layers in its recording | Texture events | Bird phrases | Duration |
| --- | --- | ---: | ---: | ---: |
| Coastline | Long ocean swells, surf wash and foam, distant rumble, tree wind, gull/tern-like calls | 57 | 96 | 660 s |
| Tundra | Snow wind, narrow ice whistles, scattered crackles, snow hiss, northern bird-like calls | 102 | 112 | 660 s |
| Desert | Dry wind, sand hiss, irregular insect pulses, raven/dove/hawk-like calls | 100 | 78 | 660 s |
| Jungle | Layered canopy rain, leaf drips, distant rain wash, independent insect pulses, tropical bird-like calls | 99 | 163 | 660 s |

All four are stereo, 24 kHz, MP3 at 112 kbit/s. Combined size is about 37 MB. The manifest records source provenance, durations, exact sizes and SHA-256 checksums. The files were generated from seeded noise, continuous mathematical oscillators, and varied event envelopes, then encoded and decoded with FFmpeg for duration verification. No short source recording was tiled to claim an eleven-minute asset. Measured correlation at a 47-second lag ranges from -0.00255 to 0.00355.

## Playback and engines

- Recordings start at randomized offsets. A second local player crossfades over six seconds on biome changes and before the current recording ends.
- Playback uses local HTML audio so file-based installation does not depend on WebAudio media-element CORS permission. All assets remain offline.
- The existing twelve live generated bird-call profiles remain in addition to the recordings. Their species labels describe the intended synthetic approximation.
- Eight engine profiles have separate oscillator families, firing-frequency factors, harmonic balance, bass and filtered intake/exhaust grit. The McLaren reference profile is labeled V8; the GR Yaris reference profile is labeled three-cylinder.
- Engine output is substantially stronger than the earlier quiet graph. Shifts reduce the main engine layer to about 15% of its loaded level; coast, braking, high-speed resonance and shift transients remain active.
- Live engine/effect output passes through dynamics compression and oversampled soft limiting. `impact(severity, kind)` supports the existing default call and distinct vehicle, tree and barrier impacts.
- Playback state exposes duration, random offset, current playback position, loaded/playing flags, transition count, errors and whether the procedural fallback is in use. A failed file is retried no more often than every 30 seconds.

## Executed checks

An isolated browser harness bundled the finished audio module and ran in headless Microsoft Edge from a **file URL**, with a real button click to unlock audio. This was independent of the main game renderer; the complete game regression belongs to the integrating task.

- All four local MP3s loaded with browser-reported duration of 660 seconds. The final run started at approximately 64.84, 14.98, 561.43 and 43.65 seconds. Each advanced about 0.61 seconds during a 0.60-second observation interval.
- A forced end-of-track transition showed two simultaneous tracks with complementary fades, then one continuing replacement track. Four transitions were counted after testing biome changes and a loop boundary.
- Pause reduced the recording volume to zero and paused its transport. Resume advanced the same track again.
- All eight engine profiles produced measurable output, reduced their thrust sound during shifts, and exposed positive braking/coast-layer gains. No sampled WebAudio output reached digital clipping.
- Vehicle, tree and barrier impacts were tested at severity 0.15 and 1.0. Strong impacts produced materially greater RMS than gentle impacts; all six cases remained below sampled digital clipping.
- All twelve live species calls produced nonzero waveform output: herring gull, common tern, cormorant, snowy owl, snow bunting, ptarmigan, red-tailed hawk, common raven, mourning dove, scarlet macaw, keel-billed toucan and little blue heron.
- The completed normal playback regression produced **zero runtime errors, zero console errors and zero HTTP/HTTPS requests**.
- A separate intentionally missing-file test produced one failed load request, visible state errors and nonzero procedural fallback audio, with no JavaScript errors or rapid request loop.

Evidence files: `runtime-qa.json`, `file-audit.json`, `fallback-qa.json`, and `manifest.json` in this folder.

## Limits

These are original synthetic approximations, not authentic field or engine recordings. They can still sound procedural. Each recording is eleven minutes long and the runtime reuses it with randomized starting points and crossfades; it is not an endless unique recording or a literal hour-long recording. The short generated fallback remains available if a local asset cannot play, and diagnostics disclose that fallback explicitly.

Waveforms, decoded durations, media playback state and transition behavior were tested. This does not establish subjective acoustic realism on every speaker, or that a human listened to every minute. HTML recording playback and WebAudio effects use separate output paths; the reported live-output clipping checks cover the WebAudio analyser, not a captured combined operating-system mix. Full-game frame pacing and installer/ZIP validation are handled by the integrating task.
