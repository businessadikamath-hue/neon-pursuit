"""Original Neon Pursuit body modeling, executed by Blender in background mode.

Usage: blender --background --python build_vehicle_bodies.py
Creates eight player and twelve traffic body meshes, an editable .blend source, and a
packed JavaScript module requiring no runtime file fetches or external assets.
The input cross sections are our own designs, not manufacturer CAD or scans.
"""
import bpy, json, math, base64, struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE=Path(__file__).resolve().parent
DESIGNS=json.loads((HERE/'body-designs.json').read_text())
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def catmull(a,b,c,d,u):
    return .5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u)

def bounded_cubic(a,b,c,d,u):
    # Shape-preserving Hermite slopes remove overshoot on flat sills/hoods.
    # This keeps the original control-point envelope without hard clipping.
    def tangent(left,right):
        return 0 if left*right<=0 else 2*left*right/(left+right)
    m0=tangent(b-a,c-b);m1=tangent(c-b,d-c)
    return (2*u**3-3*u*u+1)*b+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*c+(u**3-u*u)*m1

def original_body(car_id,p):
    sections=p['body']; rings=[]; w=p['width']/2; half_length=p['length']/2
    for i in range(len(sections)-1):
        for step in range(6):
            u=step/6; a=sections[max(0,i-1)]; b=sections[i]; c=sections[i+1]; d=sections[min(len(sections)-1,i+2)]
            rings.append([b[j]+(c[j]-b[j])*u if j==0 else catmull(a[j],b[j],c[j],d[j],u) for j in range(6)])
    rings.append(sections[-1]); verts=[]; faces=[]; count=48
    for z,ww,b,y,t,tw in rings:
        z*=half_length; ww*=w; tw*=w
        # Sculpted fender crowns wrap the wheel openings while the hood remains
        # lower between them. This is a concave hood section, not a flat slab.
        arch=max(math.exp(-((z-axle)/.48)**2*1.8) for axle in p['axles'])
        crest=t+max(0,2*p['radius']+.105-t)*arch
        shoulder=y+max(0,2*p['radius']+.055-y)*arch
        # A recessed lower door and a soft shoulder crease catch moving highlights.
        inset=(.012 if car_id=='safari' else .022 if p.get('traffic') else .039)*math.exp(-((z-.05)/.93)**4)
        mid=b+(shoulder-b)*.50
        corners=[(-ww*.90,b),(ww*.90,b),(ww*.965,b+.09),(ww*.972-inset,mid),(ww,shoulder),(ww*.84,crest),(tw*.66,t),(-tw*.66,t),(-ww*.84,crest),(-ww,shoulder),(-ww*.972+inset,mid),(-ww*.965,b+.09)]
        for j,c in enumerate(corners):
            prev=corners[(j-1)%12]; nxt=corners[(j+1)%12]; after=corners[(j+2)%12]
            # A periodic cubic surface joins with continuous tangents. The old
            # rounded-corner/straight-span ring showed broad faceted highlights.
            # Keep exactly 48 points per ring; this changes shape, not density.
            for step in range(4):
                f=step/4
                xx=bounded_cubic(prev[0],c[0],nxt[0],after[0],f)
                yy=bounded_cubic(prev[1],c[1],nxt[1],after[1],f)
                verts.append((xx,yy,z))
    for row in range(len(rings)-1):
        for j in range(count):
            a=row*count+j; b=row*count+(j+1)%count
            faces.append((a,b,b+count,a+count))
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple((len(rings)-1)*count+j for j in range(count)))
    mesh=bpy.data.meshes.new(car_id+'_original_body');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(car_id+'_body',mesh);bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    # Physical recesses replace the former wheels laid over solid side panels.
    for side in [-1,1]:
        for axle in p['axles']:
            bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=p['radius']+.047,depth=.80,location=(side*(w+.015),p['radius'],axle),rotation=(0,math.pi/2,0))
            cutter=bpy.context.object;cutter.name=car_id+'_wheel_arch_cutter'
            bpy.context.view_layer.objects.active=obj
            boolean=obj.modifiers.new('Recessed wheel arch','BOOLEAN');boolean.operation='DIFFERENCE';boolean.solver='EXACT';boolean.object=cutter
            bpy.ops.object.modifier_apply(modifier=boolean.name)
            bpy.data.objects.remove(cutter,do_unlink=True)
    # Recess the fascia/plate region instead of burying detail inside a flat cap.
    rear={'black':(1.55,.53,.235),'silver':(.59,.49,.16),'red':(1.61,.53,.235),'rally':(.57,.51,.16),'muscle':(1.63,.61,.24),'roadster':(.50,.47,.15),'electric':(.60,.48,.16),'safari':(.54,.72,.16)}.get(car_id,(.52,.49,.16))
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,rear[1],half_length+.035))
    cutter=bpy.context.object;cutter.name=car_id+'_rear_fascia_recess';cutter.scale=(rear[0],rear[2],.18)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel=cutter.modifiers.new('Rounded recess corners','BEVEL');bevel.width=.025;bevel.segments=3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    bpy.context.view_layer.objects.active=obj
    boolean=obj.modifiers.new('Recessed rear fascia','BOOLEAN');boolean.operation='DIFFERENCE';boolean.solver='EXACT';boolean.object=cutter
    bpy.ops.object.modifier_apply(modifier=boolean.name);bpy.data.objects.remove(cutter,do_unlink=True)
    front={'black':(1.25,.33,.14),'silver':(1.10,.50,.24),'red':(1.35,.30,.12),'rally':(1.15,.48,.25),'muscle':(1.22,.53,.18),'roadster':(.76,.38,.13),'electric':(.80,.36,.095),'safari':(.85,.90,.24)}.get(car_id,(p['width']*.47,.45,.16))
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,front[1],-half_length-.035))
    cutter=bpy.context.object;cutter.name=car_id+'_front_intake_recess';cutter.scale=(front[0],front[2],.18);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel=cutter.modifiers.new('Soft intake lip','BEVEL');bevel.width=.022;bevel.segments=3;bpy.ops.object.modifier_apply(modifier=bevel.name)
    bpy.context.view_layer.objects.active=obj;boolean=obj.modifiers.new('Recessed front intake','BOOLEAN');boolean.operation='DIFFERENCE';boolean.solver='EXACT';boolean.object=cutter
    bpy.ops.object.modifier_apply(modifier=boolean.name);bpy.data.objects.remove(cutter,do_unlink=True)
    bevel=obj.modifiers.new('Rounded panel and arch edges','BEVEL');bevel.width=.020 if car_id not in ['safari','rally'] else .024;bevel.segments=3;bevel.limit_method='ANGLE';bevel.angle_limit=.48
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)
    for face in obj.data.polygons:face.use_smooth=True
    # A sharp edge split preserves the machined underside and bumper end planes;
    # weighted normals remove broad diagonal shading on triangulated end caps.
    edge=obj.modifiers.new('Panel normal boundaries','EDGE_SPLIT');edge.split_angle=math.radians(48);edge.use_edge_angle=True
    bpy.ops.object.modifier_apply(modifier=edge.name)
    normal=obj.modifiers.new('Weighted body normals','WEIGHTED_NORMAL');normal.keep_sharp=True;normal.weight=40
    bpy.ops.object.modifier_apply(modifier=normal.name)
    # True UV islands avoid the former planar projection collapsing on vertical
    # bumper faces, which gave normal maps a degenerate tangent direction.
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
    mat=bpy.data.materials.new(car_id+'_preview_paint');mat.diffuse_color=tuple(((p['color']>>shift)&255)/255 for shift in [16,8,0])+(1,);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=mat.diffuse_color;bsdf.inputs['Metallic'].default_value=.36;bsdf.inputs['Roughness'].default_value=.24;bsdf.inputs['Coat Weight'].default_value=1;bsdf.inputs['Coat Roughness'].default_value=.06
    noise=mat.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=180;noise.inputs['Detail'].default_value=2
    bump=mat.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.018;bump.inputs['Distance'].default_value=.0003
    mat.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);mat.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
    obj.data.materials.append(mat);obj['source']='Original procedural design, modeled and finished in Blender';obj['reference_label']=p['name'];obj['game_id']=car_id
    obj.select_set(False)
    return obj

def packed(values,fmt):
    return base64.b64encode(struct.pack('<'+fmt*len(values),*values)).decode('ascii')

def fitted_panel_seams(obj,p):
    """Project original panel outlines onto the finished body, before gallery placement."""
    tree=BVHTree.FromObject(obj,bpy.context.evaluated_depsgraph_get())
    w=p['width']/2; L=p['length']/2; seams=[]
    def outline(corners,origin,direction):
        points=[]
        for a,b in zip(corners,corners[1:]):
            for step in range(8):
                u=step/8; v=tuple(a[n]+(b[n]-a[n])*u for n in range(2))
                hit,normal,_,_=tree.ray_cast(Vector(origin(v)),Vector(direction),5)
                if hit is None:return
                points.append([round(float(c),5) for c in hit+normal*.0012])
        if points:seams.append(points+[points[0]])
    front=p['axles'][0]+.49; rear=p['axles'][1]-.49
    top=p.get('waist',.84+(.20 if p.get('type') in [3,4,9,11] else .08 if p.get('type') in [5,6] else 0))-.035
    lower=.41 if obj['game_id']=='safari' else .36
    for side in [-1,1]:
        corners=[(top,front),(top,rear),(lower+.06,rear+.04),(lower,front+.07),(top,front)]
        outline(corners,lambda v:(side*(w+.4),v[0],v[1]),(-side,0,0))
    cabin=p.get('cabin')
    back=cabin[0][0]-.10 if cabin else (-.71 if obj['game_id']=='roadster' else -L*(.68 if p.get('type')==5 else .47)-.10)
    nose=-L+.32
    if back>nose+.15:
        corners=[(-w*.29,nose),(w*.29,nose),(w*.45,back),(-w*.45,back),(-w*.29,nose)]
        outline(corners,lambda v:(v[0],3,v[1]),(0,-1,0))
    return seams

assets={}; reports=[]
for car_id,p in DESIGNS.items():
    obj=original_body(car_id,p);mesh=obj.data;mesh.calc_loop_triangles()
    positions=[];normals=[];uvs=[];indices=[];lookup={}
    for tri in mesh.loop_triangles:
        for vi,li in zip(tri.vertices,tri.loops):
            co=mesh.vertices[vi].co;normal=mesh.corner_normals[li].vector.normalized()
            pos=tuple(round(float(c)*10000) for c in co)
            nor=tuple(round(max(-1,min(1,float(c)))*32767) for c in normal)
            loop_uv=mesh.uv_layers.active.data[li].uv
            uv=tuple(float(c) for c in loop_uv)
            key=pos+nor+uv
            if key not in lookup:
                lookup[key]=len(positions)//3;positions.extend(pos);normals.extend(nor);uvs.extend(uv)
            indices.append(lookup[key])
    if any(abs(x)>32767 for x in positions):raise ValueError('Packed body coordinate exceeds 3.2767 m')
    assets[car_id]={'position':packed(positions,'h'),'normal':packed(normals,'h'),'uv':packed(uvs,'f'),'uvEncoding':'float32','index':packed(indices,'H'),'panelSeams':fitted_panel_seams(obj,p),'vertexCount':len(positions)//3,'triangleCount':len(indices)//3,'source':'Original Blender continuous-section modeled and UV unwrapped geometry v9'}
    reports.append({'id':car_id,'vertices':len(positions)//3,'triangles':len(indices)//3,'finite':all(math.isfinite(v) for v in positions+normals)})
    # Spread editable source objects in a gallery; exported vertices remain local.
    i=len(reports)-1;obj.rotation_euler=(math.pi/2,0,0);obj.location=(i%4*3.2,i//4*6,0)

out=HERE.parent/'engine-v9'/'blenderVehicleBodiesV8.js'
out.write_text('// Original Blender-authored meshes: work/car-assets-v9/build_vehicle_bodies.py.\n// Signed int16 positions: 0.0001 m; signed normalized int16 normals; float32 UVs; uint16 indices.\nexport const blenderVehicleBodies='+json.dumps(assets,separators=(',',':'))+';\n')
(HERE/'body-build-report.json').write_text(json.dumps({'blender':bpy.app.version_string,'models':reports},indent=2))
# A usable, upright Blender source gallery with a studio camera and lighting.
# The complete game cars also include our Three.js cabins, lamps and trim.
bpy.ops.mesh.primitive_plane_add(size=60,location=(4.8,12,-.02));floor=bpy.context.object;floor.name='Studio floor'
floor_mat=bpy.data.materials.new('Studio slate');floor_mat.diffuse_color=(.12,.15,.18,1);floor.data.materials.append(floor_mat)
bpy.ops.object.camera_add(location=(15,-13,27));camera=bpy.context.object;camera.name='Body design gallery camera';camera.rotation_euler=(Vector((4.8,12,.3))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=34;bpy.context.scene.camera=camera
for name,loc,power,size in [('Soft key',(1,-5,12),1800,8),('Cool fill',(14,5,8),1000,7)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((4.8,3,0))-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.filepath=str(HERE/'blender-body-design-gallery.png')
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'neon-pursuit-vehicles-v9.blend'))
print('NEON_BODY_EXPORT',json.dumps(reports))
