import bpy, os
from pathlib import Path

out = Path(os.environ.get('BLENDER_ANIM_OUT','work/blender-final2/frames'))
out.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.image_settings.file_format = 'PNG'
scene.render.resolution_percentage = int(os.environ.get('BLENDER_ANIM_PERCENT','50'))
scene.render.filepath = str(out/'frame_####.png')
scene.frame_start = 1; scene.frame_end = 48
bpy.ops.render.render(animation=True)
print('BLENDER_ANIMATION_OUTPUT', str(out.resolve()))
