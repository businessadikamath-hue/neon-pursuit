"""Original close-range Ultra+ scenery. Blender 4.5.5; no imported assets."""
import bpy, math, json, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bank={};models=[]
def create(name,p,faces,uv):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata([(x,-z,y) for x,y,z in p],[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    layer=mesh.uv_layers.new(name='Original surface coordinates')
    for face in mesh.polygons:
        face.use_smooth=True
        for li in face.loop_indices:layer.data[li].uv=uv[mesh.loops[li].vertex_index]
    return obj
def stone(name,flat,seed):
    p=[];uv=[];faces=[];rows=12;sides=24
    # Closed rings avoid pole degeneracy, with layered erosion and chipped edges.
    for j in range(rows+1):
        t=(j+.1)/(rows+.2);phi=t*math.pi
        for k in range(sides+1):
            a=k/sides*math.tau;r=math.sin(phi)*(1+.09*math.sin(a*5+j*.4+seed)+.045*math.sin(a*11-j*.8))
            h=math.cos(phi)*flat+.025*math.sin(a*4+phi*6)*math.sin(phi)
            p.append((math.cos(a)*r,h+flat,math.sin(a)*r*.74));uv.append((k/sides,j/rows))
    for j in range(rows):
        for k in range(sides):
            a=j*(sides+1)+k;b=a+sides+1;faces.append((a,a+1,b+1,b))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple(rows*(sides+1)+k for k in range(sides))])
    obj=create(name,p,faces,uv)
    bevel=obj.modifiers.new('Weather worn edges','BEVEL');bevel.width=.018;bevel.segments=2
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj
def wood():
    p=[];faces=[];uv=[]
    def limb(start,end,ra,rb,seed):
        start=Vector(start);end=Vector(end);d=(end-start).normalized();up=Vector((0,1,0));u=d.cross(up).normalized();v=d.cross(u)
        offset=len(p);rings=16;sides=12
        for j in range(rings+1):
            t=j/rings;center=start.lerp(end,t)+Vector((math.sin(t*5)*.03,math.sin(t*math.pi)*.09,0));rad=ra*(1-t)+rb*t
            for k in range(sides+1):
                a=k/sides*math.tau;rr=rad*(1+.08*math.sin(a*7+t*3+seed)+.04*math.sin(a*13+t*43));point=center+u*(math.cos(a)*rr)+v*(math.sin(a)*rr)
                p.append(tuple(point));uv.append((k/sides,t*4))
        for j in range(rings):
            for k in range(sides):
                a=offset+j*(sides+1)+k;b=a+sides+1;faces.append((a,a+1,b+1,b))
        faces.extend([tuple(offset+k for k in range(sides-1,-1,-1)),tuple(offset+rings*(sides+1)+k for k in range(sides))])
    limb((-1.7,.18,0),(1.7,.24,.14),.19,.09,2);limb((-.48,.28,.045),(.12,.40,.85),.088,.016,8);limb((.55,.27,.10),(1.1,.48,-.61),.057,.012,4)
    return create('weathered-forked-driftwood',p,faces,uv)
def shell():
    p=[];faces=[];uv=[];rows=12;sides=20
    for j in range(rows+1):
        t=j/rows
        for k in range(sides+1):
            a=(k/sides-.5)*math.pi*1.05;r=.08+t*.62;ridge=1+.055*math.cos(k/sides*math.pi*24)*math.sin(t*math.pi)
            p.append((math.sin(a)*r,.015+math.sin(t*math.pi)*.15*ridge,math.cos(a)*r));uv.append((k/sides,t))
    for j in range(rows):
        for k in range(sides):
            a=j*(sides+1)+k;b=a+sides+1;faces.append((a,a+1,b+1,b))
    obj=create('ribbed-shore-shell',p,faces,uv);solid=obj.modifiers.new('Natural shell thickness','SOLIDIFY');solid.thickness=.012;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=solid.name);return obj
objects=[stone('layered-scree',.28,5),stone('tide-smoothed-cobble',.49,8),stone('broken-slate',.16,12),wood(),shell()]
for oi,obj in enumerate(objects):
    mesh=obj.data;mesh.calc_loop_triangles();p=[];n=[];uv=[];idx=[];dedup={}
    for tri in mesh.loop_triangles:
        for li in tri.loops:
            co=mesh.vertices[mesh.loops[li].vertex_index].co;normal=mesh.corner_normals[li].vector;tex=mesh.uv_layers.active.data[li].uv
            key=tuple(round(x,6) for x in (co.x,co.z,-co.y,normal.x,normal.z,-normal.y,*tex))
            if key not in dedup:dedup[key]=len(p)//3;p.extend(key[:3]);n.extend(key[3:6]);uv.extend(key[6:])
            idx.append(dedup[key])
    bank[obj.name]={'p':p,'n':n,'uv':uv,'i':idx};models.append({'name':obj.name,'vertices':len(p)//3,'triangles':len(idx)//3,'finite':all(math.isfinite(x) for x in p+n+uv)})
    obj.location.x=oi*4;obj['provenance']='Original authored Blender geometry; no scans or external assets'
    material=bpy.data.materials.new(obj.name+' preview');material.diffuse_color=(.30,.27,.21,1);obj.data.materials.append(material)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'original-ultra-scenery-v8.blend'))
with open(os.path.join(ROOT,'..','..','source','blenderUltraScenery8.js'),'w',encoding='utf-8')as f:f.write('// Original Blender 4.5.5 meshes; editable source in scenery-assets-v8.\nexport const blenderUltraScenery8='+json.dumps(bank,separators=(',',':'))+';\n')
report={'blender':bpy.app.version_string,'original':True,'models':models}
with open(os.path.join(ROOT,'ultra-blender-report.json'),'w',encoding='utf-8')as f:json.dump(report,f,indent=2)
print(json.dumps(report))
