"""Original v9 skull surfaces and feather revisions authored in Blender.
No imported scans or third-party mesh data. Run with Blender --background.
"""
import bpy, math, json, os
BASE=os.path.dirname(os.path.abspath(__file__))
MODULE=os.path.join(BASE,'..','engine-v9','blenderWildlife8.js')
with open(os.path.join(BASE,'..','engine','blenderWildlife8.js'),encoding='utf-8') as f: bank=json.loads(f.read().split('export const blenderWildlife8=',1)[1].strip().rstrip(';'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
profiles={
 'fox':[[.38,.025,.14,-.10],[.25,.28,.36,-.23],[.03,.36,.40,-.30],[-.22,.33,.31,-.27],[-.48,.23,.16,-.22],[-.76,.13,.055,-.15],[-1.02,.065,.01,-.11]],
 'coyote':[[.42,.025,.15,-.10],[.27,.30,.38,-.25],[.03,.37,.45,-.31],[-.24,.34,.35,-.28],[-.50,.23,.20,-.22],[-.84,.13,.08,-.16],[-1.14,.067,.045,-.12]],
 'deer':[[.38,.03,.15,-.15],[.24,.28,.47,-.25],[-.05,.37,.53,-.36],[-.36,.32,.30,-.34],[-.76,.245,.025,-.39],[-1.12,.23,-.12,-.40],[-1.32,.18,-.14,-.34]],
 'reindeer':[[.40,.03,.15,-.15],[.23,.32,.49,-.29],[-.06,.42,.54,-.40],[-.37,.36,.29,-.38],[-.78,.28,.04,-.42],[-1.10,.26,-.08,-.39],[-1.25,.21,-.11,-.34]],
 'bighorn':[[.39,.03,.18,-.17],[.22,.38,.51,-.28],[-.07,.47,.53,-.43],[-.35,.42,.37,-.42],[-.67,.32,.15,-.43],[-.95,.26,-.005,-.36],[-1.09,.20,-.07,-.30]],
 'cat':[[.40,.025,.13,-.15],[.24,.40,.46,-.31],[0,.51,.50,-.38],[-.27,.47,.39,-.41],[-.413,.38,.19,-.37],[-.53,.31,.045,-.30],[-.634,.22,-.01,-.24]],
 'hare':[[.35,.02,.12,-.13],[.20,.30,.36,-.25],[-.03,.38,.38,-.32],[-.30,.32,.25,-.31],[-.58,.23,.08,-.25],[-.77,.14,-.01,-.19],[-.84,.09,-.025,-.14]],
 'tapir':[[.42,.035,.16,-.16],[.20,.36,.47,-.31],[-.08,.43,.43,-.40],[-.37,.35,.30,-.39],[-.66,.25,.12,-.34],[-.99,.17,-.07,-.27],[-1.18,.12,-.18,-.37]],
 'capybara':[[.42,.04,.15,-.18],[.21,.36,.39,-.31],[-.09,.43,.36,-.38],[-.40,.43,.28,-.38],[-.72,.38,.16,-.35],[-.95,.29,.12,-.28],[-1.02,.23,.08,-.24]],
 'seal':[[.42,.02,.12,-.11],[.22,.31,.36,-.22],[0,.43,.40,-.32],[-.26,.42,.31,-.32],[-.53,.35,.11,-.28],[-.70,.25,.045,-.21],[-.82,.16,.02,-.14]],
 'bird':[[.70,.035,.10,-.10],[.47,.48,.45,-.30],[.10,.70,.67,-.48],[-.21,.68,.63,-.52],[-.47,.53,.38,-.38],[-.66,.29,.13,-.24],[-.77,.15,.055,-.14]]
}
def smooth(a,b,c,d,t): return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
def sample(rows,t):
    s=t*(len(rows)-1);i=min(len(rows)-2,int(s));u=s-i
    return [smooth(rows[max(0,i-1)][k],rows[i][k],rows[i+1][k],rows[min(len(rows)-1,i+2)][k],u) for k in range(4)]
def skull(name,rows):
    verts=[];faces=[];uv=[];steps=52;sides=40
    for i in range(steps+1):
        z,w,top,bottom=sample(rows,i/steps);center=(top+bottom)*.5;h=(top-bottom)*.5
        for j in range(sides+1):
            a=j/sides*math.tau
            # A soft cheek plane and broad cranial roof, without a sphere seam.
            x=math.sin(a)*w;y=center+math.cos(a)*h
            if name in ['cat','bighorn','capybara'] and math.cos(a)>.45:y-=.035*(math.cos(a)-.45)
            verts.append((x,-z,y));uv.append((j/sides,i/steps))
    for i in range(steps):
        for j in range(sides):
            a=i*(sides+1)+j;b=a+sides+1
            faces.extend([(a,a+1,b),(a+1,b+1,b)])
    for end in [0,1]:
        z,w,top,bottom=rows[-1] if end else rows[0];n=len(verts);verts.append((0,-z,(top+bottom)*.5));uv.append((.5,end))
        root=end*steps*(sides+1)
        for j in range(sides):faces.append((n,root+j+(0 if end else 1),root+j+(1 if end else 0)))
    mesh=bpy.data.meshes.new(name+' continuous skull');mesh.from_pydata(verts,[],faces);mesh.update();layer=mesh.uv_layers.new(name='Face surface')
    for poly in mesh.polygons:
        poly.use_smooth=True
        for li in poly.loop_indices:layer.data[li].uv=uv[mesh.loops[li].vertex_index]
    obj=bpy.data.objects.new(name+' anatomical loft',mesh);bpy.context.collection.objects.link(obj);return obj
report={'origin':'Original v9 geometry modeled in Blender; no imported scans','blender':bpy.app.version_string,'models':[]}
for num,(name,rows) in enumerate(profiles.items()):
    obj=skull(name,rows);m=obj.data;m.calc_loop_triangles();p=[];n=[];uv=[];ix=[];keys={}
    for tri in m.loop_triangles:
        for li in tri.loops:
            v=m.vertices[m.loops[li].vertex_index].co;normal=m.corner_normals[li].vector;tex=m.uv_layers.active.data[li].uv
            key=tuple(round(x,6) for x in (v.x,v.z,-v.y,normal.x,normal.z,-normal.y,*tex))
            if key not in keys:keys[key]=len(p)//3;p.extend(key[:3]);n.extend(key[3:6]);uv.extend(key[6:])
            ix.append(keys[key])
    bank['skull-'+name]={'p':p,'n':n,'uv':uv,'i':ix};obj.location=(num%4*2.0,num//4*2.3,0);obj['provenance']=report['origin'];report['models'].append({'name':name,'triangles':len(ix)//3,'vertices':len(p)//3})
# Narrow the original vanes and soften their overly raised central ridge.
feather=bank['flight-feather']
for i in range(0,len(feather['p']),3):feather['p'][i+1]*=.36;feather['p'][i+2]*=.86
with open(MODULE,'w',encoding='utf-8') as f:f.write('// Original v8/v9 components generated in Blender '+bpy.app.version_string+'.\nexport const blenderWildlife8='+json.dumps(bank,separators=(',',':'))+';\n')
bpy.context.scene['provenance']=report['origin'];bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE,'original-skull-studies-v9.blend'))
with open(os.path.join(BASE,'component-provenance.json'),'w') as f:json.dump(report,f,indent=2)
print(json.dumps(report))
