"""Actual bounded Cycles render of the v9 original exported body surfaces."""
import bpy, math, json, hashlib, time
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'neon-pursuit-vehicles-v9.blend'))
for obj in list(bpy.data.objects):
    if obj.get('game_id'):
        if obj.get('game_id')!='black':bpy.data.objects.remove(obj,do_unlink=True)
        else:obj.location=(0,0,0);obj.rotation_euler=(math.pi/2,0,0)
    elif obj.type in {'LIGHT','CAMERA'}:bpy.data.objects.remove(obj,do_unlink=True)
scene=bpy.context.scene
scene.world.color=(.12,.12,.12)
bpy.ops.object.camera_add(location=(5.0,-6.3,3.5));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.46))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=52;scene.camera=camera
for loc,power,size in [((-3,-4,6),650,5),((4,1,5),800,4),((-1,4,3),420,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object;lamp.data.energy=power;lamp.data.shape='DISK';lamp.data.size=size;lamp.rotation_euler=(Vector((0,0,.4))-lamp.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1300;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.filepath=str(HERE/'blender-v9-body-proof.png')
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'neon-v9-body-proof.blend'))
started=time.perf_counter();bpy.ops.render.render(write_still=True)
(HERE/'blender-render-report.json').write_text(json.dumps({'blender':bpy.app.version_string,'engine':'Cycles CPU','threads':4,'samples':32,'resolution':[1300,900],'renderSeconds':time.perf_counter()-started,'component':'Original black car body; complete runtime assembly is in the matched browser galleries','bodyModuleSHA256':hashlib.sha256((HERE.parent/'engine-v9'/'blenderVehicleBodiesV8.js').read_bytes()).hexdigest(),'imageSHA256':hashlib.sha256((HERE/'blender-v9-body-proof.png').read_bytes()).hexdigest()},indent=2))
