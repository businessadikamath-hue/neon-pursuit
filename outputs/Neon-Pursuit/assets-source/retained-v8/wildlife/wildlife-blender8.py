"""Original Ultra+ bird anatomy components, authored and exported in Blender.
Run Blender --background --python work/wildlife-blender8.py. No imported art.
"""
import bpy, math, json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = ROOT
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bank, report, objects = {}, {'blender': bpy.app.version_string, 'origin': 'Original authored Blender geometry; no downloaded meshes or textures', 'models': []}, []

def mesh(name, positions, faces, uvs):
    data = bpy.data.meshes.new(name)
    data.from_pydata([(x, -z, y) for x, y, z in positions], [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    uv = data.uv_layers.new(name='Anatomical surface')
    for poly in data.polygons:
        poly.use_smooth = True
        for li in poly.loop_indices:
            uv.data[li].uv = uvs[data.loops[li].vertex_index]
    return obj

def feather():
    p, f, uv = [], [], []
    rows, cols = 40, 8
    for row in range(rows + 1):
        t = row / rows
        width = math.sin(math.pi * t ** .67) * (.48 - .11 * t)
        for col in range(cols + 1):
            q = col / cols * 2 - 1
            edge = 1 - .026 * math.sin(t * math.pi * 58) * abs(q) ** 8
            # Asymmetric vanes and a raised central rachis, narrowing at the tip.
            z = q * width * (.68 if q < 0 else 1) * edge
            y = .027 * math.sin(t * math.pi) + .022 * (1 - abs(q)) ** 3 * (1 - t)
            p.append((t, y, z)); uv.append((t, col / cols))
    for row in range(rows):
        for col in range(cols):
            a = row * (cols + 1) + col; b = a + cols + 1
            f.extend([(a, b, a + 1), (a + 1, b, b + 1)])
    return mesh('flight-feather', p, f, uv)

def beak(kind, lower=False):
    p, f, uv = [], [], []
    rows, sides = 26, 20
    for row in range(rows + 1):
        t = row / rows
        if kind == 'parrot': width = (1 - t) ** .56; height = .80 * (1 - t) ** .48; center = .24 * math.sin(t * math.pi) - .80 * t ** 3
        elif kind == 'raptor': width = (1 - t) ** .70; height = .65 * (1 - t) ** .65; center = .10 * math.sin(t * math.pi) - .46 * t ** 4
        elif kind == 'toucan': width = (1 - t) ** .38; height = .94 * math.sin(.30 + t * 2.82) ** .55; center = .10 * math.sin(t * math.pi) - .14 * t
        elif kind == 'seed': width = (1 - t); height = .72 * (1 - t); center = -.04 * t
        else: width = (1 - t) ** .75; height = .60 * (1 - t) ** .70; center = -.06 * t
        if lower: height *= .42; center = -.09 - height * .6
        width = max(.006, width); height = max(.005, height)
        for side in range(sides + 1):
            a = side / sides * math.tau
            p.append((math.sin(a) * width, center + math.cos(a) * height, -t))
            uv.append((side / sides, t))
    for row in range(rows):
        for side in range(sides):
            a = row * (sides + 1) + side; b = a + sides + 1
            f.extend([(a, a + 1, b), (a + 1, b + 1, b)])
    return mesh(kind + ('-lower' if lower else '-upper'), p, f, uv)

def record(obj):
    data = obj.data; data.calc_loop_triangles(); p, n, uv, ids, unique = [], [], [], [], {}
    for tri in data.loop_triangles:
        for li in tri.loops:
            v = data.vertices[data.loops[li].vertex_index].co
            normal = data.corner_normals[li].vector
            tex = data.uv_layers.active.data[li].uv
            key = tuple(round(x, 6) for x in (v.x, v.z, -v.y, normal.x, normal.z, -normal.y, *tex))
            if key not in unique:
                unique[key] = len(p) // 3; p.extend(key[:3]); n.extend(key[3:6]); uv.extend(key[6:])
            ids.append(unique[key])
    assert all(math.isfinite(v) for v in p + n + uv)
    bank[obj.name] = {'p': p, 'n': n, 'uv': uv, 'i': ids}
    report['models'].append({'name': obj.name, 'vertices': len(p) // 3, 'triangles': len(ids) // 3})
    obj['provenance'] = report['origin']
    objects.append(obj)

record(feather())
for kind in ['parrot', 'raptor', 'toucan', 'seed', 'straight']:
    record(beak(kind)); record(beak(kind, True))
for i, obj in enumerate(objects):
    obj.location = (i % 4 * 2.6, i // 4 * 2.6, 0)
    mat = bpy.data.materials.new(obj.name + ' study material')
    mat.diffuse_color = (.45, .27, .09, 1) if 'feather' not in obj.name else (.08, .20, .36, 1)
    obj.data.materials.append(mat)
bpy.context.scene['provenance'] = report['origin']
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'original-wildlife-components-v8.blend'))
with open(os.path.join(ROOT, '..', '..', 'source', 'blenderWildlife8.js'), 'w', encoding='utf-8') as f:
    f.write('// Generated in Blender ' + bpy.app.version_string + ' by wildlife-blender8.py. Original geometry.\nexport const blenderWildlife8=' + json.dumps(bank, separators=(',', ':')) + ';\n')
with open(os.path.join(OUT, 'component-build.json'), 'w', encoding='utf-8') as f: json.dump(report, f, indent=2)
print(json.dumps(report))
