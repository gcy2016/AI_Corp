# 树皮管线验证：建树干 → UV 展开 → 贴图连原理化 BSDF → 打光 → Cycles 渲染
# 用法：python bark.py [贴图前缀] [hdri文件]，默认用临时贴图 bark_*.jpg、天空纹理
import bpy, bmesh, math, sys, os, glob
from mathutils import Vector, noise
pre = sys.argv[1] if len(sys.argv) > 1 else 'bark'
hdri = sys.argv[2] if len(sys.argv) > 2 else ''
here = os.path.abspath('.')
pick = lambda key: glob.glob(f'{here}/{pre}*{key}*')[0]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 800, 1000; sc.view_settings.view_transform = 'AgX'
# 1. 树干：弯曲、下粗上细，根部向外鼓出，顶部分出两根粗枝
bm = bmesh.new()
def tube(path, radii, seg=32):
    rings = []
    for k, (p, r) in enumerate(zip(path, radii)):
        t = (path[min(k+1, len(path)-1)] - path[max(k-1, 0)]).normalized()
        a = t.cross(Vector((1, 0, 0))).normalized(); b = t.cross(a)
        ring = []
        for j in range(seg):
            ang = j / seg * 2 * math.pi; d = a * math.cos(ang) + b * math.sin(ang)
            bump = 1 + 0.12 * noise.noise(p * 1.5 + d * 2.0)
            if p.z < 0.6: bump *= 1 + 0.5 * (0.6 - p.z) * (1 + math.sin(ang * 5))  # 板根
            ring.append(bm.verts.new(p + d * r * bump))
        rings.append(ring)
    for k in range(len(rings) - 1):
        for j in range(seg):
            bm.faces.new((rings[k][j], rings[k][(j+1) % seg], rings[k+1][(j+1) % seg], rings[k+1][j]))
def curve(p0, d, n, step, bend):
    pts = [Vector(p0)]
    for k in range(n):
        d = (d + Vector(bend) * 0.06 + Vector((noise.noise(pts[-1] * 0.7), noise.noise(pts[-1] * 0.7 + Vector((5, 0, 0))), 0)) * 0.05).normalized()
        pts.append(pts[-1] + d * step)
    return pts
trunk = curve((0, 0, -0.1), Vector((0, 0, 1)), 40, 0.1, (0.2, 0, 0))
tube(trunk, [0.55 - 0.25 * k / 40 for k in range(41)])
for side in (1, -1):
    br = curve(trunk[-6], Vector((side * 0.8, 0.2 * side, 1)), 25, 0.1, (side, 0, 0.3))
    tube(br, [0.24 - 0.17 * k / 25 for k in range(26)], 24)
me = bpy.data.meshes.new('trunk'); bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('trunk', me); sc.collection.objects.link(ob)
for p in me.polygons: p.use_smooth = True
# 2. UV 展开（Smart UV Project）
bpy.context.view_layer.objects.active = ob; ob.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)
bpy.ops.object.mode_set(mode='OBJECT')
# 3+4. 三张贴图连到原理化 BSDF，用 Mapping 调缩放
m = bpy.data.materials.new('bark'); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (3, 3, 3)
nt.links.new(tc.outputs['UV'], mp.inputs['Vector'])
def tex(key, color):
    n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(pick(key))
    if not color: n.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(mp.outputs['Vector'], n.inputs['Vector']); return n
nt.links.new(tex('diff', True).outputs['Color'], bsdf.inputs['Base Color'])
nt.links.new(tex('rough', False).outputs['Color'], bsdf.inputs['Roughness'])
nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.5
nt.links.new(tex('nor_gl', False).outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
me.materials.append(m)
# 地面
bpy.ops.mesh.primitive_plane_add(size=40); g = bpy.context.object
gm = bpy.data.materials.new('g'); gm.use_nodes = True; gm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.09, 0.08, 0.06, 1); g.data.materials.append(gm)
# 5. 打光：HDRI（没有就用天空纹理）+ 太阳光
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; wn = w.node_tree
if hdri:
    e = wn.nodes.new('ShaderNodeTexEnvironment'); e.image = bpy.data.images.load(os.path.abspath(hdri))
else:
    e = wn.nodes.new('ShaderNodeTexSky')
wn.links.new(e.outputs['Color'], wn.nodes['Background'].inputs['Color'])
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 4; sun.data.angle = 0.05
sun.rotation_euler = (math.radians(55), 0, math.radians(-40)); sc.collection.objects.link(sun)
# 6. 相机 + Cycles 渲染
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 35; cam.location = (1.6, -4.2, 1.0)
t = bpy.data.objects.new('t', None); sc.collection.objects.link(t); t.location = (0.3, 0, 2.2)
c = cam.constraints.new('TRACK_TO'); c.target = t; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
sc.render.filepath = f'{here}/render-{pre}.png'
bpy.ops.render.render(write_still=True); print('done', sc.render.filepath)
