"""Render actual assembled runtime anatomy in Blender, using original exports."""
import bpy, json, gzip, base64, struct, os, math, sys
from mathutils import Vector, Euler
ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=ROOT
VERSION=sys.argv[sys.argv.index('--version')+1] if '--version' in sys.argv else 'v9'
with gzip.open(os.path.join(OUT,'assembled-'+VERSION+'.json.gz'),'rt') as f: data=json.load(f)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True
scene.render.resolution_x=2240;scene.render.resolution_y=1380;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.world.color=(.16,.16,.16)
scene.view_settings.view_transform='AgX'
materials={}
for kind in ['coat','fur','eyes','wet','feathers']:
    mat=bpy.data.materials.new(kind);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');color=mat.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Authored color'
    mat.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value=.12 if kind in ['wet','eyes'] else .90
    if kind=='wet': bsdf.inputs['Alpha'].default_value=.06;bsdf.inputs['Coat Weight'].default_value=1
    materials[kind]=mat
def light(name,p,power,size):
    lamp=bpy.data.lights.new(name,'AREA');lamp.energy=power;lamp.shape='DISK';lamp.size=size
    obj=bpy.data.objects.new(name,lamp);scene.collection.objects.link(obj);obj.location=p;obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox',(1,9,8),2100,8);light('Cool rim',(-7,-3,5),1800,7);light('Fill',(7,6,2),1000,5)
cameraData=bpy.data.cameras.new('Review camera');camera=bpy.data.objects.new('Review camera',cameraData);scene.collection.objects.link(camera);scene.camera=camera
camera.location=(0,18,3.0);camera.rotation_euler=(Vector((0,0,.1))-camera.location).to_track_quat('-Z','Y').to_euler();cameraData.type='ORTHO';cameraData.ortho_scale=12.4
collections=[]
def decode(value):
    raw=base64.b64decode(value);return struct.unpack('<'+'f'*(len(raw)//4),raw)
for view in ['close','full']:
    collection=bpy.data.collections.new('Actual assembled '+view);scene.collection.children.link(collection);collections.append(collection)
    for subject in data['subjects']:
        col=subject['biome'];row=0 if subject['type']=='mammal' else 1
        parent=bpy.data.objects.new(subject['name']+' '+view,None);collection.objects.link(parent)
        parent.location=((1.5-col)*3.0,0,1.8-row*3.0)
        parent.rotation_euler[2]=-.58
        scale=(2.1 if subject['type']=='mammal' else 4.3) if view=='close' else (1.05 if subject['type']=='mammal' else 1.10)
        parent.scale=(scale,scale,scale)
        for part in subject[view]:
            p=decode(part['positions']);colors=decode(part['colors']);vertices=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)]
            if not vertices: continue
            mesh=bpy.data.meshes.new(subject['name']+' '+part['kind']);mesh.from_pydata(vertices,[],[(i,i+1,i+2) for i in range(0,len(vertices),3)]);mesh.update()
            color=mesh.color_attributes.new(name='Authored color',type='FLOAT_COLOR',domain='POINT')
            for i in range(len(vertices)):color.data[i].color=(*colors[i*3:i*3+3],1)
            for polygon in mesh.polygons:polygon.use_smooth=True
            normals=decode(part['normals'])
            mesh.normals_split_custom_set_from_vertices([(normals[i],-normals[i+2],normals[i+1]) for i in range(0,len(normals),3)])
            obj=bpy.data.objects.new(mesh.name,mesh);collection.objects.link(obj);obj.parent=parent;obj.data.materials.append(materials[part['kind']])
            x,y,z=part['p'];obj.location=(x,-z,y)
            rx,ry,rz=part['rot'];obj.rotation_euler=(rx,-rz,ry)
        label=bpy.data.curves.new(subject['name'],'FONT');label.body=subject['name'];label.align_x='CENTER';label.size=.205;label.extrude=0
        obj=bpy.data.objects.new('Label '+subject['name'],label);collection.objects.link(obj);obj.location=((1.5-col)*3,0,-.1-row*3.0);obj.rotation_euler=(math.pi/2,0,math.pi)
        mat=bpy.data.materials.new('Label');mat.diffuse_color=(.82,.85,.78,1);obj.data.materials.append(mat)
    collection.hide_render=True
scene['provenance']=data['origin'];scene['review_note']='Actual runtime geometry. Contact sheets use studio lighting and static gallery poses, not an in-game screenshot.'
for i,view in enumerate(['close','full']):
    if '--full-only' in sys.argv and view!='full':continue
    cameraData.ortho_scale=12.4 if view=='close' else 14.0
    for j,collection in enumerate(collections):collection.hide_render=i!=j
    scene.render.filepath=os.path.join(OUT,'assembled-'+VERSION+'-'+view+'.png')
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'assembled-'+VERSION+'-review.blend'))
