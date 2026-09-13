from pathlib import Path
import bpy

_SCRIPT_DIR = Path(__file__).resolve().parent
_ROOT_CANDIDATES = [_SCRIPT_DIR.parent.parent, _SCRIPT_DIR.parent, _SCRIPT_DIR]
ROOT = next((p for p in _ROOT_CANDIDATES if (p / 'assets-source').exists() or (p / 'work').exists()), _SCRIPT_DIR.parent.parent)
OUT = Path(__import__('os').environ.get('BLENDER_PBR_OUT', str(ROOT / 'work' / 'blender-final3')))
if not (OUT / 'neon-pursuit-blender-cinematic.blend').exists():
    packaged = ROOT / 'gallery' / 'blender'
    if (packaged / 'neon-pursuit-blender-cinematic.blend').exists():
        OUT = packaged
BLEND = OUT / 'neon-pursuit-blender-cinematic.blend'

bpy.ops.wm.open_mainfile(filepath=str(BLEND))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 144
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 10
scene.cycles.diffuse_bounces = 4
scene.cycles.glossy_bounces = 6
scene.cycles.transmission_bounces = 8
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.frame_set(1)
scene.render.filepath = str(OUT / 'hero-still.png')
bpy.ops.render.render(write_still=True)

# A compact geometry GLB accompanies the packed .blend.  The cinematic player
# uses the lossless render sequence; this model link stays practical to open in
# a browser while the editable scene retains every PBR image.
glb = OUT / 'hero-blender-ultraplus.glb'
try:
    if glb.exists():
        glb.unlink()
except Exception:
    pass
bpy.ops.export_scene.gltf(
    filepath=str(glb),
    export_format='GLB',
    export_image_format='NONE',
    export_materials='PLACEHOLDER',
    export_unused_images=False,
    export_unused_textures=False,
    export_apply=False,
    use_selection=False,
)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
print('FINAL_PBR', str(OUT / 'hero-still.png'), str(glb), glb.stat().st_size if glb.exists() else 0)
