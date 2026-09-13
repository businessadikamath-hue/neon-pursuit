"""Original Ultra+ vehicle parts; Blender 4.5.5. No external model or texture assets.

Builds three genuinely sculpted tread profiles, drilled/vented brake rotor and a
beveled caliper. Embedded geometry is used by the game, not only the preview.
Add -- --render to also produce the actual Blender wheel render.
"""
import bpy, math, json, struct, base64, sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,metal=0,rough=.5):
    m=bpy.data.materials.new(name);m.use_nodes=True;s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1);s.inputs['Metallic'].default_value=metal;s.inputs['Roughness'].default_value=rough;return m
rubber=material('Original matte vulcanized rubber',(.0056,.0075,.0091),0,.88)
metal=material('Machined brake steel',(.28,.31,.34),.94,.30)
red=material('Caliper enamel',(.30,.025,.015),.42,.27)
alloy=material('Brushed rim alloy',(.47,.53,.58),1,.23)
def mesh_object(name,vertices,faces,mat):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat);bpy.context.view_layer.objects.active=o;o.select_set(True)
    for f in mesh.polygons:f.use_smooth=True
    return o
def tire(name,pitch,offroad=False,sport=False):
    # Unit radial dimension; fixed realistic 0.28m section width. The runtime
    # scales only radial Y/Z to each existing wheel radius.
    shoulders=[(-.142,.72),(-.145,.80),(-.139,.885),(-.132,.944),(-.117,.980)]
    tread=[(-.101+j*.202/54,1.0) for j in range(55)]
    profile=shoulders+tread+[(.117,.980),(.132,.944),(.139,.885),(.145,.80),(.142,.72),(-.142,.72)]
    count=256;vertices=[];faces=[]
    for i in range(count):
        a=2*math.pi*i/count
        for x,r in profile:
            depth=0
            if abs(x)<=.102:
                r=1-.010*(abs(x)/.105)**4
                lanes=[-.065,-.022,.022,.065] if not sport else [-.050,.050]
                if min(abs(x-lane) for lane in lanes)<(.0038 if offroad else .0027):depth=.045 if offroad else .009
                phase=(a/(2*math.pi)*pitch+abs(x)*19)%1
                if phase<(.24 if offroad else .16 if not sport else .10):depth=max(depth,.044 if offroad else .008)
                # Shoulder slots remain visible at three-quarter views.
                if abs(x)>.075 and phase<.32:depth=max(depth,.032 if offroad else .006)
            vertices.append((x,(r-depth)*math.sin(a),(r-depth)*math.cos(a)))
    width=len(profile)
    for i in range(count):
        for j in range(width-1):faces.append((i*width+j,i*width+j+1,((i+1)%count)*width+j+1,((i+1)%count)*width+j))
    o=mesh_object(name,vertices,faces,rubber)
    uv=o.data.uv_layers.new(name='Original cylindrical tire UV')
    for f in o.data.polygons:
        for li in f.loop_indices:
            vi=o.data.loops[li].vertex_index;angle=vi//width/count
            if f.index//(width-1)==count-1 and angle==0:angle=1
            uv.data[li].uv=(angle,(vi%width)/(width-1))
    o.select_set(False);return o
def cylinder(name,radius,depth,location,mat,vertices=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=location,rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name;o.data.materials.append(mat);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);return o
def cut(obj,cutter,label):
    bpy.context.view_layer.objects.active=obj;m=obj.modifiers.new(label,'BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter;bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cutter,do_unlink=True)
def finish(obj,bevel=.003):
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    m=obj.modifiers.new('Original machined edge radii','BEVEL');m.width=bevel;m.segments=2;bpy.ops.object.modifier_apply(modifier=m.name)
    for f in obj.data.polygons:f.use_smooth=True
    m=obj.modifiers.new('Preserved surface boundaries','EDGE_SPLIT');m.split_angle=math.radians(45);bpy.ops.object.modifier_apply(modifier=m.name)
    m=obj.modifiers.new('Weighted machined normals','WEIGHTED_NORMAL');m.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT');obj.select_set(False)
    return obj
parts={}
parts['sportTire']=tire('sportTire',48,sport=True)
parts['roadTire']=tire('roadTire',60)
parts['offroadTire']=tire('offroadTire',38,offroad=True)
rotor=cylinder('drilledRotor',.56,.038,(0,0,0),metal,128)
cut(rotor,cylinder('center bore cutter',.095,.14,(0,0,0),metal,32),'Central hub bore')
for ring,radius in enumerate([.35,.46]):
    for i in range(20):
        angle=(i+ring*.45)*math.pi/10
        cut(rotor,cylinder('drilling tool',.016 if ring==0 else .019,.14,(0,radius*math.sin(angle),radius*math.cos(angle)),metal,12),'Real drilled cooling hole')
parts['drilledRotor']=finish(rotor,.0025)
# Weighted corner normals can lean into the drilled-hole bevels even on the
# large planar cap polygons. Set only those cap loops to the analytic normal;
# preserve the generated radial/bevel normals and the physical hole geometry.
rotor_mesh=rotor.data
cap_normals=[tuple(n.vector.normalized()) for n in rotor_mesh.corner_normals]
fixed_cap_faces=0;fixed_cap_loops=0
for face in rotor_mesh.polygons:
    face.use_smooth=True
    xs=[rotor_mesh.vertices[v].co.x for v in face.vertices]
    if max(xs)-min(xs)<1e-6 and abs(sum(xs)/len(xs))>.01899:
        normal=(1 if sum(xs)>0 else -1,0,0)
        for li in face.loop_indices:cap_normals[li]=normal;fixed_cap_loops+=1
        fixed_cap_faces+=1
rotor_mesh.normals_split_custom_set(cap_normals);rotor_mesh.update()
rotor['planar_cap_faces_corrected']=fixed_cap_faces;rotor['planar_cap_loops_corrected']=fixed_cap_loops
bpy.ops.mesh.primitive_cube_add(size=1);caliper=bpy.context.object;caliper.name='beveledCaliper';caliper.scale=(.22,.48,.24);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);caliper.data.materials.append(red)
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,-.10));cutter=bpy.context.object;cutter.scale=(.12,.30,.24);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);cut(caliper,cutter,'Brake pad bridge recess')
parts['beveledCaliper']=finish(caliper,.027)
def pack(values,fmt):return base64.b64encode(struct.pack('<'+fmt*len(values),*values)).decode()
assets={};reports=[]
for name,o in parts.items():
    mesh=o.data;mesh.calc_loop_triangles();p=[];n=[];uv=[];idx=[];seen={}
    for tri in mesh.loop_triangles:
        for vi,li in zip(tri.vertices,tri.loops):
            co=tuple(float(c) for c in mesh.vertices[vi].co);normal=tuple(round(c*32767) for c in mesh.corner_normals[li].vector.normalized());coords=tuple(float(c) for c in mesh.uv_layers.active.data[li].uv);key=co+normal+coords
            if key not in seen:seen[key]=len(p)//3;p.extend(co);n.extend(normal);uv.extend(coords)
            idx.append(seen[key])
    assets[name]={'position':pack(p,'f'),'normal':pack(n,'h'),'uv':pack(uv,'f'),'index':pack(idx,'I'),'vertices':len(p)//3,'triangles':len(idx)//3}
    reports.append({'name':name,'vertices':len(p)//3,'triangles':len(idx)//3,'finite':all(math.isfinite(x) for x in p+n+uv)})
    o.hide_render=True;o.hide_set(True)
(HERE.parent/'engine-v9'/'heroVehicleParts.js').write_text('// Original Blender parts. Source: work/car-assets-v9/build_hero_details.py\nexport const heroVehicleParts='+json.dumps(assets,separators=(',',':'))+';\n')
(HERE/'hero-parts-report.json').write_text(json.dumps({'blender':bpy.app.version_string,'planarRotorCapFacesCorrected':fixed_cap_faces,'planarRotorCapLoopsCorrected':fixed_cap_loops,'parts':reports},indent=2))
# This is an actual Blender preview of the same exported tire/rotor/caliper.
def instance(source,name,location,scale):
    o=source.copy();o.data=source.data;bpy.context.collection.objects.link(o);o.name=name;o.hide_render=False;o.hide_set(False);o.location=location;o.scale=scale;return o
instance(parts['sportTire'],'Hero preview - actual exported tire',(0,0,.395),(1,.395,.395))
instance(parts['drilledRotor'],'Hero preview - actual exported rotor',(.091,0,.395),(.395,.395,.395))
instance(parts['beveledCaliper'],'Hero preview - actual exported caliper',(.084,.155,.425),(.395,.395,.395))
for i in range(10):
    a=(i//2)*math.pi*2/5+(-.075 if i%2==0 else .075); bpy.ops.mesh.primitive_cube_add(size=1,location=(.167,.1264*math.sin(a),.395+.1264*math.cos(a)));o=bpy.context.object;o.name='Original preview rim spoke';o.scale=(.024,.026,.241);o.rotation_euler.x=-a;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(alloy);finish(o,.005)
cylinder('Original preview wheel hub',.038,.035,(.163,0,.395),alloy,32)
bpy.ops.mesh.primitive_torus_add(major_radius=.284,minor_radius=.012,major_segments=96,minor_segments=8,location=(.155,0,.395),rotation=(0,math.pi/2,0));bpy.context.object.data.materials.append(alloy)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.001));bpy.context.object.data.materials.append(material('Studio floor',(.10,.12,.14),.05,.42))
bpy.ops.object.camera_add(location=(1.45,-1.1,.95));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.39))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=62;bpy.context.scene.camera=cam
for loc,energy,size in [((1,-2,3),280,2),((-1,1,2),350,2),((2,2,1.2),160,1.3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.35))-o.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.resolution_x=1300;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.filepath=str(HERE/'blender-ultraplus-wheel.png');scene.world.color=(.13,.13,.13)
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'neon-ultraplus-parts.blend'))
if '--render' in sys.argv:bpy.ops.render.render(write_still=True)
print('NEON_HERO_PARTS',json.dumps(reports))
