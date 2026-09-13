"""Original v9 scenery assets. Run in installed Blender; no imported assets."""
import bpy, math, random, json, os
from mathutils import Vector

ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=ROOT
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bank={}; report={'blender':bpy.app.version_string,'origin':'Original authored procedural meshes generated inside Blender; no imported or downloaded art','models':[]}

def p3(p): return (p[0],-p[2],p[1])
def mesh_object(name,verts,faces,uvs):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([p3(v) for v in verts],[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    uv=mesh.uv_layers.new(name='Bark grain')
    for poly in mesh.polygons:
        poly.use_smooth=True
        for loop in poly.loop_indices: uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
    return obj

def trunk(kind,lod):
    rng=random.Random(381+len(kind)*713)
    h,ra,rb={'coastal':(4.45,.29,.12),'desert':(2.90,.20,.085),'kapok':(4.45,.42,.18),'conifer':(8.4,.23,.018),'palm':(8.32,.25,.12)}[kind]
    rings=18 if lod==1 else 28;sides=12 if lod==1 else 18
    verts=[];faces=[];uvs=[]
    for j in range(rings+1):
        t=j/rings;center=(.85*math.sin(t) if kind=='palm' else .18*t+.040*math.sin(t*math.pi*1.5),h*t,.12*t+.045*math.sin(t*math.pi*2) if kind in ['kapok','coastal','desert'] else 0)
        for i in range(sides+1):
            a=i/sides*math.tau
            flare=(.07 if kind in ['palm','conifer'] else .15 if kind=='kapok' else .10)*math.exp(-t*12)
            ridge=(.015 if kind=='kapok' else .007)*math.sin(a*7+t*2.5+math.sin(t*13)*.2)*(1-t*.5)
            ring=.007*math.sin((t+.003*math.sin(a*2))*math.tau*13) if kind=='palm' else .0018*math.sin(a*19+t*70)
            radius=ra+(rb-ra)*t+flare+ridge+ring
            verts.append((center[0]+math.sin(a)*radius,center[1],center[2]+math.cos(a)*radius))
            uvs.append((i/sides,t*h*.52))
    for j in range(rings):
        for i in range(sides):
            a=j*(sides+1)+i;b=a+sides+1;faces.extend([(a,a+1,b),(a+1,b+1,b)])
    if kind!='palm':
        roots=7 if kind=='kapok' else 5
        for k in range(roots):
            a=k*2.399+rng.uniform(-.18,.18);length=(1.15 if kind=='kapok' else .64 if kind=='coastal' else .48)*(.75+rng.random()*.60)
            height=(1.55 if kind=='kapok' else .68 if kind=='coastal' else .39)*(.72+rng.random()*.45);thick=.085 if kind=='kapok' else .050
            base=len(verts);steps=7 if lod==1 else 10;rs=6 if lod==1 else 8
            for j in range(steps+1):
                t=j/steps;rad=.06+length*t;yy=height*(1-t)**2+.025
                curve=a+math.sin(t*math.pi)*.10
                center=(math.sin(curve)*rad,(yy+.025)*.5,math.cos(curve)*rad);width=thick*(1-t*.90);vertical=(yy-.025)*.5+.012
                for q in range(rs+1):
                    angle=q/rs*math.tau
                    verts.append((center[0]+math.cos(curve)*math.sin(angle)*width,center[1]+math.cos(angle)*vertical,center[2]-math.sin(curve)*math.sin(angle)*width))
                    uvs.append((q/rs,t*length*.8))
            for j in range(steps):
                for q in range(rs):
                    c=base+j*(rs+1)+q;d=c+rs+1;faces.extend([(c,c+1,d),(c+1,d+1,d)])
    obj=mesh_object(f'{kind}-lod{lod}',verts,faces,uvs)
    # Weld positional seam duplicates while retaining UV loops; Blender then
    # supplies continuous authored normals across the cylindrical seam.
    weld=obj.modifiers.new('Continuous bark seam','WELD');weld.merge_threshold=.00001
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=weld.name)
    return obj

def rock(index):
    rng=random.Random(938+index*91)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1)
    obj=bpy.context.object;obj.name=f'weathered-rock-{index}'
    for v in obj.data.vertices:
        x,y,z=v.co;warp=1+.14*math.sin(x*4.8+y*7+index)*math.cos(z*6.1-x*3)+.035*math.sin(z*21+y*17)
        v.co=(x*warp*(1+index*.08),y*warp*(.82+index*.12),max(-.7,z*warp*.74))
    # A small real Blender bevel adds weathered edge planes to the authored form.
    bevel=obj.modifiers.new('Weather softened edges','BEVEL');bevel.width=.014;bevel.segments=2
    bevel.limit_method='ANGLE';bevel.angle_limit=.35
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)
    for p in obj.data.polygons:p.use_smooth=True
    mesh=obj.data;uv=mesh.uv_layers.new(name='Stone surface')
    for poly in mesh.polygons:
        for loop in poly.loop_indices:
            v=mesh.vertices[mesh.loops[loop].vertex_index].co
            uv.data[loop].uv=(math.atan2(v.y,v.x)/math.tau+.5,v.z*.55+.5)
    return obj

def record(obj):
    mesh=obj.data;mesh.calc_loop_triangles();pos=[];norm=[];uv=[];indices=[];dedup={}
    for tri in mesh.loop_triangles:
        for li in tri.loops:
            loop=mesh.loops[li];v=mesh.vertices[loop.vertex_index];n=mesh.corner_normals[li].vector;tex=mesh.uv_layers.active.data[li].uv
            p=(v.co.x,v.co.z,-v.co.y);nn=(n.x,n.z,-n.y)
            key=tuple(round(a,6) for a in (*p,*nn,*tex))
            if key not in dedup:
                dedup[key]=len(pos)//3;pos.extend(key[:3]);norm.extend(key[3:6]);uv.extend(key[6:])
            indices.append(dedup[key])
    finite=all(math.isfinite(v) for v in pos+norm+uv)
    if not finite:raise ValueError(obj.name+' has nonfinite data')
    bank[obj.name]={'p':pos,'n':norm,'uv':uv,'i':indices}
    report['models'].append({'name':obj.name,'vertices':len(pos)//3,'triangles':len(indices)//3,'finite':finite})
    obj['source']='Original v9 Blender scenery; editable generation script included'

objects=[]
for kind in ['coastal','desert','kapok','conifer','palm']:
    for lod in [1,2]:
        obj=trunk(kind,lod);record(obj);objects.append(obj)
for i in range(3):
    obj=rock(i);record(obj);objects.append(obj)
for i,obj in enumerate(objects):
    obj.location=(i%5*4,i//5*12,0)
    mat=bpy.data.materials.new('Stone' if 'rock' in obj.name else 'Bark');mat.diffuse_color=(.25,.28,.24,1) if 'rock' in obj.name else (.30,.23,.16,1);obj.data.materials.append(mat)
bpy.context.scene['provenance']=report['origin']
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'original-scenery-v9.blend'))
module='// Generated by work/scenery-assets-v9/generate-scenery-v9.py in Blender '+bpy.app.version_string+'. Original assets only.\nexport const blenderScenery8='+json.dumps(bank,separators=(',',':'))+';\n'
with open(os.path.join(ROOT,'..','engine-v9','blenderScenery8.js'),'w',encoding='utf-8') as f:f.write(module)
with open(os.path.join(OUT,'build-report.json'),'w',encoding='utf-8') as f:json.dump(report,f,indent=2)
print(json.dumps(report))
