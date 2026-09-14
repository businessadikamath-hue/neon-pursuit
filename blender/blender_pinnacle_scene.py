import bpy
import math
import os
import random
from pathlib import Path
from mathutils import Vector

random.seed(420042)
OUT = Path(os.environ.get('BLENDER_SCENE_OUT', 'work/blender-pinnacle'))
OUT.mkdir(parents=True, exist_ok=True)
ROOT = Path(__file__).resolve().parent.parent

def set_input(node, names, value):
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return socket
    return None

def principled(name, base, metallic=0.0, rough=.45, emission=None, emission_strength=0.0,
               transmission=0.0, ior=1.45, coat=0.0, coat_rough=.08):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    set_input(p, ['Base Color'], (*base, 1.0))
    set_input(p, ['Metallic'], metallic)
    set_input(p, ['Roughness'], rough)
    set_input(p, ['IOR'], ior)
    set_input(p, ['Coat Weight', 'Clearcoat'], coat)
    set_input(p, ['Coat Roughness', 'Clearcoat Roughness'], coat_rough)
    set_input(p, ['Transmission Weight', 'Transmission'], transmission)
    if emission is not None:
        set_input(p, ['Emission Color', 'Emission'], (*emission, 1.0))
        set_input(p, ['Emission Strength'], emission_strength)
    nt.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    if transmission > 0.0:
        m.surface_render_method = 'DITHERED' if hasattr(m, 'surface_render_method') else None
    return m

def transparent_glass(name='transparent smoked glass'):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    trans = n.new('ShaderNodeBsdfTransparent')
    p = n.new('ShaderNodeBsdfPrincipled')
    set_input(p, ['Base Color'], (.012,.06,.085,1)); set_input(p, ['Metallic'], .05); set_input(p, ['Roughness'], .055); set_input(p, ['IOR'], 1.52); set_input(p, ['Coat Weight','Clearcoat'], .82); set_input(p, ['Coat Roughness','Clearcoat Roughness'], .024); set_input(p, ['Transmission Weight','Transmission'], .34)
    mix = n.new('ShaderNodeMixShader'); mix.inputs[0].default_value=.42
    l.new(trans.outputs['BSDF'],mix.inputs[1]); l.new(p.outputs['BSDF'],mix.inputs[2]); l.new(mix.outputs['Shader'],out.inputs['Surface'])
    if hasattr(m,'surface_render_method'): m.surface_render_method='DITHERED'
    return m

def procedural_asphalt():
    m = bpy.data.materials.new('Ultra asphalt with exposed aggregate')
    m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    p = n.new('ShaderNodeBsdfPrincipled')
    tex = n.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 58; tex.inputs['Detail'].default_value = 9; tex.inputs['Roughness'].default_value = .85
    ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position = .25; ramp.color_ramp.elements[0].color = (.015,.019,.022,1); ramp.color_ramp.elements[1].position = .74; ramp.color_ramp.elements[1].color = (.12,.14,.15,1)
    bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .32; bump.inputs['Distance'].default_value = .035
    coord = n.new('ShaderNodeTexCoord')
    l.new(coord.outputs['Generated'], tex.inputs['Vector']); l.new(tex.outputs['Fac'], ramp.inputs['Fac']); l.new(ramp.outputs['Color'], p.inputs['Base Color']); l.new(tex.outputs['Fac'], bump.inputs['Height']); l.new(bump.outputs['Normal'], p.inputs['Normal']); l.new(p.outputs['BSDF'], out.inputs['Surface'])
    p.inputs['Roughness'].default_value = .84; p.inputs['Specular IOR Level'].default_value = .27
    return m

def procedural_water():
    m = bpy.data.materials.new('Animated ocean surface')
    m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial'); p = n.new('ShaderNodeBsdfPrincipled')
    coord = n.new('ShaderNodeTexCoord'); mapping = n.new('ShaderNodeMapping'); noise = n.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 1.6; noise.inputs['Detail'].default_value = 7; noise.inputs['Roughness'].default_value = .82
    bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .42; bump.inputs['Distance'].default_value = .18
    ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (.004,.025,.055,1); ramp.color_ramp.elements[1].color = (.035,.23,.34,1)
    l.new(coord.outputs['Generated'], mapping.inputs['Vector']); l.new(mapping.outputs['Vector'], noise.inputs['Vector']); l.new(noise.outputs['Fac'], bump.inputs['Height']); l.new(noise.outputs['Fac'], ramp.inputs['Fac']); l.new(ramp.outputs['Color'], p.inputs['Base Color']); l.new(bump.outputs['Normal'], p.inputs['Normal']); l.new(p.outputs['BSDF'], out.inputs['Surface'])
    p.inputs['Metallic'].default_value = .24; p.inputs['Roughness'].default_value = .13
    mapping.inputs['Location'].default_value = (0,0,0); mapping.inputs['Location'].keyframe_insert('default_value', index=0, frame=1); mapping.inputs['Location'].default_value[0] = 3.0; mapping.inputs['Location'].keyframe_insert('default_value', index=0, frame=48)
    return m

def cloud_material():
    m = bpy.data.materials.new('Slow drifting cloud veil')
    m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial'); p = n.new('ShaderNodeBsdfPrincipled'); p.inputs['Base Color'].default_value = (.82,.88,.94,1); p.inputs['Roughness'].default_value = 1.0
    coord = n.new('ShaderNodeTexCoord'); mapping = n.new('ShaderNodeMapping'); noise = n.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 1.35; noise.inputs['Detail'].default_value = 4; noise.inputs['Roughness'].default_value = .7
    ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position = .48; ramp.color_ramp.elements[1].position = .64; ramp.color_ramp.elements[0].color = (0,0,0,1); ramp.color_ramp.elements[1].color = (1,1,1,1)
    l.new(coord.outputs['Generated'], mapping.inputs['Vector']); l.new(mapping.outputs['Vector'], noise.inputs['Vector']); l.new(noise.outputs['Fac'], ramp.inputs['Fac']); l.new(ramp.outputs['Color'], p.inputs['Alpha']); l.new(p.outputs['BSDF'], out.inputs['Surface'])
    p.inputs['Alpha'].default_value = .0
    m.surface_render_method = 'DITHERED' if hasattr(m, 'surface_render_method') else None
    mapping.inputs['Location'].keyframe_insert('default_value', index=0, frame=1); mapping.inputs['Location'].default_value[0] = 2.0; mapping.inputs['Location'].keyframe_insert('default_value', index=0, frame=48)
    return m

def add_box(name, loc, dims, mat, bevel=.02, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rotation)
    o = bpy.context.object; o.name = name; o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new('machined edge bevel', 'BEVEL'); mod.width = bevel; mod.segments = 3
    o.data.materials.append(mat); return o

def add_cylinder(name, loc, radius, depth, mat, rotation=(0,0,0), vertices=48, bevel=.01):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    o = bpy.context.object; o.name = name; o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('edge softening','BEVEL'); mod.width=bevel; mod.segments=3
    return o

def add_uvsphere(name, loc, scale, mat, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o

def add_ico(name, loc, scale, mat, subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o

def add_curve(name, points, bevel, mat):
    cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.bevel_depth=bevel; cu.bevel_resolution=4; cu.resolution_u=12
    sp=cu.splines.new('BEZIER'); sp.bezier_points.add(len(points)-1)
    for bp,co in zip(sp.bezier_points,points): bp.co=co; bp.handle_left_type='AUTO'; bp.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,cu); bpy.context.collection.objects.link(o); o.data.materials.append(mat); return o

def add_text(name, body, loc, size, mat, face_sign):
    cu=bpy.data.curves.new(name,'FONT'); cu.body=body; cu.align_x='CENTER'; cu.align_y='CENTER'; cu.size=size; cu.extrude=.007; cu.bevel_depth=.002; cu.bevel_resolution=3
    o=bpy.data.objects.new(name,cu); bpy.context.collection.objects.link(o); o.location=loc; o.rotation_euler=(-math.pi/2*face_sign,0,0); o.data.materials.append(mat); return o

def add_door_panel(side, mat, trim_mat):
    # A curved patch follows the shoulder of the source body instead of a floating cuboid.
    ys=(-.62,-.30,.06,.42,.68); zs=(.37,.52,.69,.80)
    verts=[]
    for z in zs:
        for y in ys:
            width=1.005 + .055*math.cos((y-.03)*1.35) - .08*max(0,z-.72)
            verts.append((side*width,y,z))
    faces=[]; cols=len(ys)
    for r in range(len(zs)-1):
        for c in range(cols-1):
            a=r*cols+c; faces.append((a,a+1,a+1+cols,a+cols))
    me=bpy.data.meshes.new('curved inset door skin mesh'); me.from_pydata(verts,[],faces); me.update(); o=bpy.data.objects.new('curved inset door skin',me); bpy.context.collection.objects.link(o); me.materials.append(mat)
    sol=o.modifiers.new('panel micro thickness','SOLIDIFY'); sol.thickness=.018
    bev=o.modifiers.new('panel edge rounding','BEVEL'); bev.width=.012; bev.segments=3
    add_curve('front door seam',[(side*1.065,-.57,.34),(side*1.065,-.57,.79),(side*1.065,.47,.84),(side*1.065,.47,.34)],.007,trim_mat)
    add_curve('door lower crease',[(side*1.064,-.50,.40),(side*1.064,.10,.36),(side*1.064,.62,.42)],.005,alloy if 'alloy' in globals() else trim_mat)

def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def add_plate(prefix, y, face_sign, plate_mat, cyan, magenta, dark, z=.53):
    # Face is vertical in Blender: X horizontal, Z vertical, Y depth.
    add_box(prefix+' backing', (0,y,z), (.74,.045,.205), dark, .018)
    add_box(prefix+' cyan rim', (0,y+face_sign*.026,z+.095), (.70,.014,.008), cyan, .004)
    add_box(prefix+' magenta rim', (0,y+face_sign*.026,z-.095), (.70,.014,.008), magenta, .004)
    add_box(prefix+' left rim', (-.345,y+face_sign*.026,z), (.008,.014,.18), cyan, .004)
    add_box(prefix+' right rim', (.345,y+face_sign*.026,z), (.008,.014,.18), magenta, .004)
    chars='N7N042' if prefix.startswith('front') else 'N7N042'
    glyphs={'0':['111','101','101','101','111'],'2':['110','001','010','100','111'],'4':['101','101','111','001','001'],'7':['111','001','010','010','010'],'N':['1001','1101','1011','1001']}
    x0=-.27; step=.108
    # Real extruded font glyphs sit above the micro-dot relief, so a close crop reads every letter.
    for i,ch in enumerate(chars):
        add_text(f'{prefix} raised letter {i}',ch,(x0+i*step,y+face_sign*.064,z-.008),.112,white if 'white' in globals() else cyan,face_sign)
    if os.environ.get('BLENDER_MICRO_PLATE','0')=='1':
        for i,ch in enumerate(chars):
            rows=glyphs.get(ch,glyphs['0']); width=len(rows[0]);
            for r,row in enumerate(rows):
                for c,v in enumerate(row):
                    if v!='1': continue
                    # Optional dot relief for macro photography; the readable text remains the hero layer.
                    xx=x0+i*step+(c-(width-1)/2)*.018
                    zz=z+.052-r*.025
                    add_box(f'{prefix} glyph {i} {r} {c}',(xx,y+face_sign*.052,zz),(.014,.016,.016), cyan if (i+r)%2==0 else magenta,.003)
    for x in (-.29,.29): add_cylinder(prefix+' screw',(x,y+face_sign*.048,z),.011,.018,plate_mat,rotation=(math.pi/2,0,0),vertices=20,bevel=.002)

def add_wheel(side, y, radius, rubber, alloy, rotor, caliper):
    x=side*.92; z=radius+.04
    bpy.ops.mesh.primitive_torus_add(major_radius=radius*.82, minor_radius=.105, major_segments=96, minor_segments=24, location=(x,y,z), rotation=(0,math.pi/2,0))
    tire=bpy.context.object; tire.name=f'road tire {side} {y}'; tire.data.materials.append(rubber)
    add_cylinder('machined rotor',(x+side*.025,y,z),radius*.56,.025,rotor,rotation=(0,math.pi/2,0),vertices=72,bevel=.003)
    add_cylinder('caliper',(x+side*.085,y-.09,z+.05),.045,.075,caliper,rotation=(0,math.pi/2,0),vertices=24,bevel=.008)
    for a in range(10):
        ang=a*math.tau/10
        spoke=add_box('rim spoke',(x+side*.10,y+math.sin(ang)*radius*.34,z+math.cos(ang)*radius*.34),(.035,.035,radius*.58),alloy,.006,rotation=(ang,0,0))
    add_cylinder('wheel hub',(x+side*.12,y,z),.07,.04,alloy,rotation=(0,math.pi/2,0),vertices=32,bevel=.004)

def add_tree(x,y,height, trunk_mat, leaf_mat, variant=0):
    add_cylinder('tree trunk',(x,y,height*.42),.11,height*.84,trunk_mat,vertices=16,bevel=.025)
    for i in range(8 if variant else 6):
        a=i*math.tau/(8 if variant else 6); r=.22+random.random()*.28; zz=height*(.55+random.random()*.32)
        add_ico('tree crown',(x+math.cos(a)*r,y+math.sin(a)*r*.6,zz),(r*.9,r*.7,r*.65),leaf_mat,2)
    if variant:
        for i in range(3):
            add_cylinder('branch',(x+(i-1)*.15,y,height*.65+i*.06),.035,.65,trunk_mat,rotation=(0,math.radians(55+(i-1)*18),math.radians(i*25)),vertices=12,bevel=.008)

def add_bird(x,y,z, scale, feather, beak, eye):
    body=add_uvsphere('bird body',(x,y,z),(scale*.22,scale*.42,scale*.22),feather,20,12)
    add_uvsphere('bird head',(x,y+scale*.36,z+scale*.03),(scale*.20,scale*.20,scale*.20),feather,20,12)
    add_ico('bird beak',(x,y+scale*.56,z+scale*.03),(scale*.06,scale*.18,scale*.055),beak,1)
    for side in (-1,1):
        add_uvsphere('bird eye',(x+side*scale*.14,y+scale*.47,z+scale*.10),(scale*.035,scale*.035,scale*.035),eye,12,8)
        wing=add_curve('layered wing',[(x+side*scale*.12,y+scale*.08,z+scale*.05),(x+side*scale*.42,y,z+scale*.02),(x+side*scale*.55,y-scale*.02,z-scale*.06)],scale*.045,feather)

def append_mesh_assets(filepath, names, offset=(0,0,0), scale=1.0):
    """Append selected authored Blender meshes from the verified scenery/wildlife source files."""
    with bpy.data.libraries.load(str(filepath), link=False) as (data_from, data_to):
        data_to.objects = [name for name in names if name in data_from.objects]
    for obj in data_to.objects:
        if obj is None: continue
        bpy.context.collection.objects.link(obj)
        obj.location = (obj.location.x + offset[0], obj.location.y + offset[1], obj.location.z + offset[2])
        obj.scale = tuple(v*scale for v in obj.scale)
        if obj.type == 'MESH':
            for poly in obj.data.polygons: poly.use_smooth = True
    return [o for o in data_to.objects if o is not None]

# Keep the highest-detail black body mesh from the existing Blender asset and rebuild the surrounding scene.
body = bpy.data.objects.get('black_body')
if body is None:
    raise RuntimeError('black_body was not found in the source blend')
for o in list(bpy.context.scene.objects):
    if o != body: bpy.data.objects.remove(o, do_unlink=True)
body.name='hero blackline body · Blender source'
body.location=(0,0,0); body.rotation_euler=(math.pi/2,0,0)

paint=principled('blackline paint with clearcoat',(0.006,0.012,0.018),metallic=.72,rough=.18,coat=.82,coat_rough=.035)
body.data.materials.clear(); body.data.materials.append(paint)

rubber=principled('vulcanized rubber',(0.006,0.008,0.009),rough=.92)
alloy=principled('brushed wheel alloy',(.32,.38,.42),metallic=.94,rough=.24,coat=.25)
rotor=principled('drilled rotor steel',(.16,.18,.19),metallic=.88,rough=.34)
caliper=principled('caliper enamel',(.55,.018,.012),metallic=.40,rough=.25,emission=(.22,.004,.002),emission_strength=.35)
dark=principled('carbon and seam relief',(.004,.006,.008),metallic=.18,rough=.50)
interior=principled('cabin interior',(.012,.019,.024),rough=.65)
seat=principled('seat leather',(.028,.036,.042),rough=.46,coat=.22,coat_rough=.09)
glass=transparent_glass()
plate=principled('plate metal',(.28,.33,.35),metallic=.74,rough=.28)
cyan=principled('neon cyan',(0.0,.25,.40),metallic=.15,rough=.18,emission=(0.0,.75,1.0),emission_strength=12)
magenta=principled('neon magenta',(.42,.0,.14),metallic=.15,rough=.18,emission=(1.0,.0,.35),emission_strength=12)
white=principled('headlight white',(.7,.85,1.0),metallic=.1,rough=.14,emission=(.65,.85,1.0),emission_strength=9)
red=principled('tail light red',(.32,.002,.004),metallic=.1,rough=.18,emission=(1.0,.003,.002),emission_strength=8)
trunk=principled('tree bark',(.055,.025,.012),rough=.86)
leaves=principled('leaf wax',(.018,.12,.028),rough=.63,coat=.22,coat_rough=.17)
stone=procedural_asphalt()
water=procedural_water()
clouds=cloud_material()
sand=principled('shore sand',(.31,.19,.09),rough=.93)

# Wheels, brakes, wells, side seals and lower carbon sill.
for side in (-1,1):
    for y in (-1.42,1.44): add_wheel(side,y,.38,rubber,alloy,rotor,caliper)
    add_box('lower door sill',(side*1.085,0,.31),(.045,2.35,.10),dark,.012)
    # Curved inset door skin follows the source body instead of reading as a floating slab.
    add_door_panel(side,paint,dark)
    add_box('flush door handle',(side*1.112,.03,.78),(.026,.25,.036),alloy,.012)
    add_cylinder('hinge pin',(side*1.113,-.59,.50),.016,.035,alloy,rotation=(0,math.pi/2,0),vertices=16,bevel=.003)
    add_cylinder('hinge pin',(side*1.113,-.59,.76),.016,.035,alloy,rotation=(0,math.pi/2,0),vertices=16,bevel=.003)
    # side glazing plus roof glass; transparent enough to reveal the modeled cabin.
    add_box('side glass',(side*1.052,.15,.92),(.012,1.12,.24),glass,.035)
    add_box('rear quarter glass',(side*1.045,.92,.85),(.012,.30,.18),glass,.028)
    # mirror and aerodynamic fin.
    add_box('mirror stem',(side*1.16,-.70,1.01),(.035,.18,.035),dark,.01,rotation=(0,0,math.radians(side*12)))
    add_uvsphere('mirror cap',(side*1.18,-.78,1.03),(.11,.16,.07),paint,24,12)
    add_box('mirror glass',(side*1.235,-.80,1.03),(.012,.10,.045),glass,.008)

# A low roof and structural pillars turn the source body into a sealed cabin while leaving the glass transparent.
add_box('roof shell',(0,.05,1.02),(1.42,1.72,.10),paint,.12)
add_box('roof glass',(0,.20,1.082),(1.08,1.18,.018),glass,.07)
for pillar_side in (-1,1):
    add_box('A pillar',(pillar_side*.64,.83,1.00),(.075,.12,.52),paint,.03,rotation=(math.radians(-13),0,0))
    add_box('B pillar',(pillar_side*.64,-.47,1.00),(.075,.11,.46),dark,.025,rotation=(math.radians(8),0,0))
add_box('windshield glass',(0,1.30,1.00),(1.18,.025,.27),glass,.045,rotation=(math.radians(-14),0,0))
add_box('rear glass',(0,-1.25,.98),(1.10,.025,.23),glass,.04,rotation=(math.radians(13),0,0))

# Cabin interior and stitching that reads through the glazing.
for side in (-1,1):
    add_box('seat base',(side*.34,-.13,.63),(.38,.56,.13),seat,.055)
    add_box('seat back',(side*.34,-.40,.91),(.38,.16,.55),seat,.055,rotation=(math.radians(-8),0,0))
    for i in range(7): add_curve('seat stitch',[(side*.34-.11,-.49+i*.028,.90),(side*.34+.11,-.49+i*.028,.90)],.003,cyan)
add_box('dashboard',(0,.75,.92),(1.20,.16,.18),interior,.04)
add_box('center console',(0,.05,.73),(.24,.60,.12),interior,.03)
add_cylinder('steering wheel',(-.37,.58,.91),.16,.025,alloy,rotation=(math.pi/2,0,0),vertices=48,bevel=.004)
add_box('instrument display',(-.37,.52,1.02),(.23,.018,.10),cyan,.008)
add_box('center display',(0,.68,1.03),(.30,.018,.14),cyan,.01)

# Plate, front splitter, rear grille and light bars.
add_plate('front plate',2.31,1,plate,cyan,magenta,dark,.55)
add_plate('rear plate',-2.31,-1,plate,cyan,magenta,dark,.55)
add_box('front splitter',(0,2.34,.25),(1.75,.18,.07),dark,.025)
add_box('rear diffuser',(0,-2.34,.27),(1.62,.16,.11),dark,.025)
for side in (-1,1):
    add_box('headlight',(side*.59,2.31,.60),(.34,.035,.14),white,.035)
    add_box('taillight',(side*.64,-2.31,.64),(.48,.035,.07),red,.018)
    add_box('exhaust',(side*.32,-2.36,.38),(.12,.08,.12),alloy,.02)
for i in range(6): add_box('front grille fin',(0,2.345,.40+i*.055),(1.02,.025,.012),alloy,.004)

# Road, shoulder, aggregate stones, lane paint, coast and horizon.
road=add_box('road slab',(0,0,-.08),(8.6,48,.16),stone,.03)
paintline=principled('worn lane paint',(.86,.82,.62),metallic=.05,rough=.46)
for x in (-2.55,2.55):
    line=add_box('lane divider',(x,0,.012),(.055,47,.018),paintline,.005)
    for i in range(75):
        if random.random()<.27:
            add_box('paint chip',(x+random.uniform(-.04,.04),-23+i*.62+random.uniform(-.17,.17),.022),(random.uniform(.018,.07),random.uniform(.02,.10),.008),dark,.002,rotation=(0,0,random.random()*math.tau))
add_box('left shoulder',(-6.0,4,-.06),(6.0,40,.12),sand,.02)
add_box('right shoulder',(6.0,4,-.06),(6.0,40,.12),sand,.02)
add_box('ocean',(0,28,-.12),(70,32,.20),water,.01)

for i in range(520):
    x=random.uniform(-4.1,4.1); y=random.uniform(-22,22)
    if abs(x)<1.8 and abs(y)<3.3: continue
    s=random.uniform(.012,.034)
    add_ico('exposed road aggregate',(x,y,.018),(s*1.8,s,s*.45),stone,1)

for x,y in [(-5.2,4),(-5.8,9),(-4.9,14),(-6.2,19),(5.0,6),(5.8,11),(5.2,16),(6.0,21)]: add_tree(x,y,random.uniform(3.1,5.2),trunk,leaves,variant=random.randint(0,1))
for i in range(24):
    x=random.choice([-1,1])*random.uniform(4.0,6.0); y=random.uniform(-1,24)
    add_ico('weathered roadside rock',(x,y,random.uniform(.10,.26)),(random.uniform(.12,.35),random.uniform(.14,.40),random.uniform(.10,.28)),sand,2)

# Bring the higher-resolution authored tree and rock meshes into the same render so close vegetation
# uses the actual Blender assets rather than only the procedural fallback silhouettes.
append_mesh_assets(ROOT/'work/scenery-assets-v9/original-scenery-v9.blend',['coastal-lod2'],offset=(-8.0,9.0,0.0),scale=1.0)
append_mesh_assets(ROOT/'work/scenery-assets-v9/original-scenery-v9.blend',['conifer-lod2'],offset=(-3.0,7.5,0.0),scale=1.0)
append_mesh_assets(ROOT/'work/scenery-assets-v9/original-scenery-v9.blend',['kapok-lod2'],offset=(4.5,9.0,0.0),scale=.95)
append_mesh_assets(ROOT/'work/scenery-assets-v9/original-scenery-v9.blend',['palm-lod2'],offset=(-5.0,15.0,0.0),scale=.86)
append_mesh_assets(ROOT/'work/scenery-assets-v9/original-scenery-v9.blend',['weathered-rock-2'],offset=(-1.5,14.0,.08),scale=.60)

# Bird silhouettes are fully modeled scene objects; their wing layers and eyes survive close crops.
for i in range(5): add_bird(-3.2+i*1.35,8+i*2.0,3.4+random.uniform(-.15,.35),.30+random.uniform(-.05,.06),leaves,caliper,white)
append_mesh_assets(ROOT/'work/wildlife-assets-v9/assembled-v9-review.blend',['Herring gull feathers','Herring gull eyes','Herring gull wet'],offset=(-1.4,7.0,3.2),scale=.62)

# Sky and lighting.
world=bpy.data.worlds.get('World') or bpy.data.worlds.new('World'); bpy.context.scene.world=world; world.use_nodes=True
wn=world.node_tree.nodes; wl=world.node_tree.links; wn.clear(); bg=wn.new('ShaderNodeBackground'); sky=wn.new('ShaderNodeTexSky'); sky.sky_type='HOSEK_WILKIE'; sky.sun_elevation=math.radians(24); sky.sun_rotation=math.radians(112); sky.altitude=.18; sky.air_density=1.1; wl.new(sky.outputs['Color'],bg.inputs['Color']); bg.inputs['Strength'].default_value=.32; out=wn.new('ShaderNodeOutputWorld'); wl.new(bg.outputs['Background'],out.inputs['Surface'])
bpy.ops.object.light_add(type='SUN', location=(0,-4,10)); sun=bpy.context.object; sun.name='late afternoon sun'; sun.rotation_euler=(math.radians(28),math.radians(-18),math.radians(-28)); sun.data.energy=3.2; sun.data.angle=math.radians(6)
for loc,energy,size,color in [((-4,-5,6),1100,5.0,(.64,.82,1.0)),((4,-1,4),950,4.0,(1.0,.35,.18)),((0,5,7),1300,5.0,(.75,.88,1.0))]:
    bpy.ops.object.light_add(type='AREA',location=loc); a=bpy.context.object; a.name='cinematic softbox'; a.data.energy=energy; a.data.shape='DISK'; a.data.size=size; a.data.color=color; aim(a,(0,0,.55))

# Camera orbit animation: the same physical scene is rendered from rear, side and front views.
bpy.ops.object.camera_add(location=(3.6,-6.5,2.35)); cam=bpy.context.object; cam.name='Blender cinematic camera'; cam.data.lens=52; cam.data.sensor_width=36; bpy.context.scene.camera=cam
for frame,loc,target in [(1,(3.7,-6.5,2.25),(0,0,.72)),(16,(5.2,-1.7,1.65),(0,0,.72)),(32,(3.2,4.8,1.90),(0,.15,.72)),(48,(-3.5,6.1,2.15),(0,.1,.72))]:
    cam.location=loc; aim(cam,target); cam.keyframe_insert('location',frame=frame); cam.keyframe_insert('rotation_euler',frame=frame)

# Cloud veil planes sit high above the physical horizon and drift with the animated material mapping.
cloudmat=clouds
for i in range(7):
    add_box('cloud bank',(random.uniform(-14,14),random.uniform(10,28),random.uniform(5.5,8.0)),(random.uniform(5,11),.12,random.uniform(.7,1.4)),cloudmat,.25,rotation=(0,random.uniform(-.08,.08),random.uniform(-.16,.16)))

scene=bpy.context.scene; scene.frame_start=1; scene.frame_end=48; scene.render.fps=24; scene.render.resolution_x=int(os.environ.get('BLENDER_RES_X','1280')); scene.render.resolution_y=int(os.environ.get('BLENDER_RES_Y','720')); scene.render.resolution_percentage=int(os.environ.get('BLENDER_RES_PERCENT','100'))
scene.render.engine='CYCLES' if os.environ.get('BLENDER_ENGINE','EEVEE').upper()=='CYCLES' else 'BLENDER_EEVEE'; scene.render.image_settings.file_format='PNG'; scene.render.film_transparent=False
if scene.render.engine == 'CYCLES':
    scene.cycles.samples=int(os.environ.get('BLENDER_SAMPLES','96')); scene.cycles.use_denoising=True; scene.cycles.max_bounces=6; scene.cycles.diffuse_bounces=3; scene.cycles.glossy_bounces=3; scene.cycles.transmission_bounces=6
if hasattr(scene,'node_tree'):
    scene.use_nodes=True; cn=scene.node_tree.nodes; cl=scene.node_tree.links; cn.clear(); rl=cn.new('CompositorNodeRLayers'); glare=cn.new('CompositorNodeGlare'); glare.glare_type='FOG_GLOW'; glare.quality='HIGH'; glare.threshold=.65; glare.size=7; comp=cn.new('CompositorNodeComposite'); cl.new(rl.outputs['Image'],glare.inputs['Image']); cl.new(glare.outputs['Image'],comp.inputs['Image'])
scene.render.image_settings.color_mode='RGBA'; scene.view_settings.look='AgX - Medium High Contrast'
scene.render.filepath=str(OUT/'hero-still.png'); scene.frame_set(1); bpy.ops.render.render(write_still=True)

# Build a real Blender animation file and a PNG frame sequence from the same keyed scene.
# This Blender build has no FFMPEG encoder, so the numbered frames remain lossless and portable;
# the saved .blend contains the complete camera/material animation for any video encoder.
scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(OUT/'frame_####.png')
if os.environ.get('BLENDER_SKIP_ANIM','0') != '1':
    still_percent=scene.render.resolution_percentage; scene.render.resolution_percentage=int(os.environ.get('BLENDER_ANIM_PERCENT','50')); bpy.ops.render.render(animation=True); scene.render.resolution_percentage=still_percent

scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(OUT/'hero-still.png'); bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'neon-pursuit-blender-cinematic.blend'))
try:
    bpy.ops.export_scene.gltf(filepath=str(OUT/'hero-blender-ultraplus.glb'), export_format='GLB', export_materials='EXPORT', export_animations=True)
except Exception as exc:
    print('GLTF_EXPORT_WARNING',repr(exc))
print('BLENDER_PINNACLE_OUTPUT',str(OUT.resolve()))
