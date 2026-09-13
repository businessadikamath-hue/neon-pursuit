"""Attach the embedded Poly Haven PBR payloads to the Blender cinematic scene.

This is intentionally a post-process for the assembled scene: it keeps the
hand-modelled car, wildlife, shoreline and lighting intact while upgrading the
large surfaces that dominate the camera with measured colour, roughness and
normal maps.  The resulting blend packs the maps so it remains portable.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import bpy


_SCRIPT_DIR = Path(__file__).resolve().parent
_ROOT_CANDIDATES = [_SCRIPT_DIR.parent.parent, _SCRIPT_DIR.parent, _SCRIPT_DIR]
ROOT = next((p for p in _ROOT_CANDIDATES if (p / "assets-source").exists() or (p / "work").exists()), _SCRIPT_DIR.parent.parent)
_asset_candidates = [ROOT / "work" / "blender-final2" / "assets", ROOT / "assets-source" / "blender-pbr"]
ASSET_DIR = next((p for p in _asset_candidates if p.exists()), _asset_candidates[0])
_scene_candidates = [
    ROOT / "work" / "blender-final2" / "neon-pursuit-blender-cinematic.blend",
    ROOT / "gallery" / "blender" / "neon-pursuit-blender-cinematic.blend",
]
SRC_BLEND = next((p for p in _scene_candidates if p.exists()), _scene_candidates[0])
OUT_DIR = Path(os.environ.get("BLENDER_PBR_OUT", str(ROOT / "work" / "blender-final3")))


def image(path: Path, colorspace: str):
    if not path.exists():
        raise FileNotFoundError(path)
    # Reuse the loaded image if Blender already has it; this avoids loading a
    # second 4K copy when the script is re-run during QA.
    img = bpy.data.images.get(path.name)
    if img is None:
        img = bpy.data.images.load(str(path), check_existing=True)
    try:
        img.colorspace_settings.name = colorspace
    except Exception:
        pass
    img.use_fake_user = True
    return img


def tex_node(nt, label: str, img, colorspace: str):
    node = nt.nodes.new("ShaderNodeTexImage")
    node.name = label
    node.label = label
    node.image = img
    node.interpolation = "Linear"
    node.extension = "REPEAT"
    try:
        node.image.colorspace_settings.name = colorspace
    except Exception:
        pass
    return node


def make_pbr_material(name: str, base_path: Path, normal_path: Path, rough_path: Path,
                      scale=(1.0, 1.0, 1.0), tint=(1.0, 1.0, 1.0, 1.0),
                      roughness_multiplier=1.0, bump_strength=0.35):
    """Create a UV-free Generated-coordinate PBR material."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (720, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (420, 0)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["IOR"].default_value = 1.46

    # Generated coordinates make the maps work on both the procedural meshes
    # and the appended asset meshes without requiring a UV unwrap.
    coord = nt.nodes.new("ShaderNodeTexCoord")
    coord.location = (-900, 0)
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.location = (-700, 0)
    mapping.inputs["Scale"].default_value = scale
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])

    base = tex_node(nt, "PBR colour 4K", image(base_path, "sRGB"), "sRGB")
    base.location = (-450, 160)
    # A restrained tint keeps the real measured albedo while allowing the
    # scene's palette to remain coherent under the cyan/magenta lighting.
    if tint != (1.0, 1.0, 1.0, 1.0):
        tint_node = nt.nodes.new("ShaderNodeRGB")
        tint_node.location = (-450, 330)
        tint_node.outputs[0].default_value = tint
        mix = nt.nodes.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs[0].default_value = 0.12
        mix.location = (0, 180)
        nt.links.new(base.outputs["Color"], mix.inputs[1])
        nt.links.new(tint_node.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], bsdf.inputs["Base Color"])
    else:
        nt.links.new(base.outputs["Color"], bsdf.inputs["Base Color"])

    rough = tex_node(nt, "PBR roughness 4K", image(rough_path, "Non-Color"), "Non-Color")
    rough.location = (-450, -20)
    mult = nt.nodes.new("ShaderNodeMath")
    mult.operation = "MULTIPLY"
    mult.inputs[1].default_value = roughness_multiplier
    mult.location = (0, -100)
    nt.links.new(rough.outputs["Color"], mult.inputs[0])
    nt.links.new(mult.outputs[0], bsdf.inputs["Roughness"])

    normal = tex_node(nt, "PBR normal 4K", image(normal_path, "Non-Color"), "Non-Color")
    normal.location = (-450, -250)
    normal_map = nt.nodes.new("ShaderNodeNormalMap")
    normal_map.location = (-30, -260)
    normal_map.inputs["Strength"].default_value = 0.85
    nt.links.new(normal.outputs["Color"], normal_map.inputs["Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.location = (210, -230)
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = 0.12
    nt.links.new(normal_map.outputs["Normal"], bump.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat["pbr_source"] = "Poly Haven photographic payload"
    mat["pbr_base"] = base_path.name
    mat["pbr_normal"] = normal_path.name
    mat["pbr_roughness"] = rough_path.name
    mat["pbr_mapping"] = list(scale)
    return mat


def assign(obj, mat):
    if not obj or not hasattr(obj.data, "materials"):
        return False
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    obj["pbr_material"] = mat.name
    return True


def assign_by_name(predicate, mat):
    count = 0
    for obj in bpy.context.scene.objects:
        if predicate(obj):
            count += int(assign(obj, mat))
    return count


def main():
    if not SRC_BLEND.exists():
        raise FileNotFoundError(SRC_BLEND)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(SRC_BLEND))

    road = make_pbr_material(
        "PBR asphalt 4K",
        ASSET_DIR / "road-4k-map.jpg",
        ASSET_DIR / "road-4k-normalMap.jpg",
        ASSET_DIR / "road-4k-roughnessMap.jpg",
        scale=(3.2, 18.0, 1.0),
        tint=(0.55, 0.58, 0.62, 1.0),
        roughness_multiplier=0.92,
        bump_strength=0.42,
    )
    sand = make_pbr_material(
        "PBR shoreline sand 4K",
        ASSET_DIR / "sand-4k-map.jpg",
        ASSET_DIR / "sand-4k-normalMap.jpg",
        ASSET_DIR / "sand-4k-roughnessMap.jpg",
        scale=(7.0, 9.0, 4.0),
        tint=(0.82, 0.78, 0.68, 1.0),
        roughness_multiplier=1.08,
        bump_strength=0.32,
    )
    bark = make_pbr_material(
        "PBR bark 4K",
        ASSET_DIR / "bark-4k-map.jpg",
        ASSET_DIR / "bark-4k-normalMap.jpg",
        ASSET_DIR / "bark-4k-roughnessMap.jpg",
        scale=(3.2, 3.2, 3.2),
        tint=(0.86, 0.82, 0.76, 1.0),
        roughness_multiplier=1.12,
        bump_strength=0.52,
    )
    rock = make_pbr_material(
        "PBR rock 1K",
        ASSET_DIR / "rock-1k-map.jpg",
        ASSET_DIR / "rock-1k-normalMap.jpg",
        ASSET_DIR / "rock-1k-roughnessMap.jpg",
        scale=(4.0, 4.0, 4.0),
        tint=(0.74, 0.76, 0.78, 1.0),
        roughness_multiplier=1.08,
        bump_strength=0.48,
    )

    touched = {
        "road": assign(bpy.data.objects.get("road slab"), road),
        "left_shoulder": assign(bpy.data.objects.get("left shoulder"), sand),
        "right_shoulder": assign(bpy.data.objects.get("right shoulder"), sand),
        "bark_procedural": assign_by_name(lambda o: any((m and (m.name == "tree bark" or m.name.startswith("Bark"))) for m in getattr(o.data, "materials", [])), bark),
        "rock_assets": assign_by_name(lambda o: any((m and (m.name.startswith("Stone") or m.name == "shore sand")) for m in getattr(o.data, "materials", [])) and ("rock" in o.name.lower() or "aggregate" in o.name.lower()), rock),
    }
    # The aggregate pebbles intentionally receive stone detail; the lane paint
    # and dividers remain separate clean geometry over the textured slab.
    for obj in bpy.context.scene.objects:
        if obj.name.startswith("exposed road aggregate"):
            touched["road_aggregate"] = touched.get("road_aggregate", 0) + int(assign(obj, rock))
        elif obj.name.startswith("weathered roadside rock"):
            touched["roadside_rocks"] = touched.get("roadside_rocks", 0) + int(assign(obj, rock))
    if bpy.data.objects.get("weathered-rock-2"):
        touched["hero_rock"] = assign(bpy.data.objects.get("weathered-rock-2"), rock)

    scene = bpy.context.scene
    scene["pbr_surface_upgrade"] = "4K asphalt/sand/bark plus 1K rock Poly Haven payloads"
    scene["pbr_surface_counts"] = json.dumps(touched, sort_keys=True)
    scene["pbr_assets_packed"] = True

    # Keep the hero render at full resolution in the path-traced renderer.
    scene.render.engine = "BLENDER_EEVEE" if os.environ.get("BLENDER_PBR_ENGINE") == "EEVEE" else "CYCLES"
    if scene.render.engine == "CYCLES":
        scene.cycles.samples = int(os.environ.get("BLENDER_PBR_SAMPLES", "144"))
        scene.cycles.use_denoising = True
        scene.cycles.max_bounces = 10
        scene.cycles.diffuse_bounces = 4
        scene.cycles.glossy_bounces = 6
        scene.cycles.transmission_bounces = 8
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.filepath = str(OUT_DIR / "hero-still.png")
    scene.frame_set(16)
    bpy.ops.render.render(write_still=True)

    # Pack all PBR payloads into the editable scene so opening the .blend from
    # another computer does not depend on the source workspace.
    for img in bpy.data.images:
        if img.filepath and any(img.filepath.endswith(name) for name in (
            "road-4k-map.jpg", "road-4k-normalMap.jpg", "road-4k-roughnessMap.jpg",
            "sand-4k-map.jpg", "sand-4k-normalMap.jpg", "sand-4k-roughnessMap.jpg",
            "bark-4k-map.jpg", "bark-4k-normalMap.jpg", "bark-4k-roughnessMap.jpg",
            "rock-1k-map.jpg", "rock-1k-normalMap.jpg", "rock-1k-roughnessMap.jpg",
        )):
            try:
                img.pack()
            except Exception:
                pass

    blend_path = OUT_DIR / "neon-pursuit-blender-cinematic.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    glb_path = OUT_DIR / "hero-blender-ultraplus.glb"
    try:
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path),
            export_format="GLB",
            export_image_format="AUTO",
            export_apply=False,
            use_selection=False,
        )
    except Exception as exc:
        print("GLB export warning:", exc)
    report = {
        "source": str(SRC_BLEND),
        "output": str(blend_path),
        "engine": scene.render.engine,
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "samples": getattr(scene.cycles, "samples", None),
        "touched": touched,
        "packedImages": sorted(img.name for img in bpy.data.images if img.packed_file),
    }
    (OUT_DIR / "pbr-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
