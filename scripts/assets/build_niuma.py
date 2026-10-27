import bpy
import sys
import math
from mathutils import Vector
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pet_pipeline import reset_scene, make_material, export_glb, render_poster

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "web" / "public" / "assets" / "pets"
OUT_DIR.mkdir(parents=True, exist_ok=True)
GLB_PATH = OUT_DIR / "niuma.glb"
POSTER_PATH = OUT_DIR / "niuma.png"

# Niuma's visual language: warm orange, cream, charcoal, and a mint work signal.
COLORS = {
    "orange": (0.95, 0.29, 0.14, 1.0),
    "orange_dark": (0.55, 0.12, 0.06, 1.0),
    "cream": (0.96, 0.86, 0.68, 1.0),
    "cream_light": (1.0, 0.95, 0.83, 1.0),
    "charcoal": (0.035, 0.05, 0.07, 1.0),
    "mint": (0.42, 0.88, 0.70, 1.0),
    "hoof": (0.10, 0.12, 0.14, 1.0),
}


reset_scene()
MATS = {name: make_material(name, color[:3], roughness=0.55) for name, color in COLORS.items()}
MATS["mint"].node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = COLORS["mint"]
MATS["mint"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.35


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def smooth(obj):
    if hasattr(obj.data, "polygons"):
        for poly in obj.data.polygons:
            poly.use_smooth = True
    return obj


def uv(name, location, scale, mat, segments=20, rings=12, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat)
    smooth(obj)
    if parent:
        obj.parent = parent
    return obj


def cone(name, location, radius1, radius2, depth, mat, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=radius1, radius2=radius2, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat)
    smooth(obj)
    if parent:
        obj.parent = parent
    return obj


def cyl(name, location, radius, depth, mat, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat)
    smooth(obj)
    if parent:
        obj.parent = parent
    return obj


def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


root = empty("NiumaPet")
head_rig = empty("HeadRig", root)
tail_rig = empty("TailRig", root)
left_arm_rig = empty("LeftArmRig", root)
right_arm_rig = empty("RightArmRig", root)

# Compact body with a friendly horse/cow silhouette.
uv("Body", (0.0, 0.0, 1.55), (0.82, 0.56, 0.98), MATS["orange"], parent=root)
uv("Chest", (0.0, -0.42, 1.57), (0.55, 0.24, 0.62), MATS["orange"], parent=root)

# Head and cream muzzle.
uv("Head", (0.0, -0.04, 2.42), (0.70, 0.56, 0.64), MATS["orange"], parent=head_rig)
uv("Muzzle", (0.0, -0.57, 2.25), (0.50, 0.23, 0.29), MATS["cream_light"], parent=head_rig)
for x in (-0.18, 0.18):
    uv("Nostril", (x, -0.78, 2.27), (0.065, 0.035, 0.055), MATS["charcoal"], segments=12, rings=8, parent=head_rig)

# Large expressive eyes with mint glints.
for x in (-0.29, 0.29):
    uv("EyeWhite", (x, -0.49, 2.56), (0.18, 0.08, 0.23), MATS["cream_light"], parent=head_rig)
    uv("Pupil", (x, -0.57, 2.57), (0.085, 0.035, 0.13), MATS["charcoal"], segments=16, rings=10, parent=head_rig)
    uv("EyeGlint", (x - 0.025, -0.605, 2.65), (0.022, 0.012, 0.032), MATS["cream_light"], segments=10, rings=6, parent=head_rig)

# Ears and horns: unmistakable Niuma shape without looking aggressive.
for x, sign in ((-0.43, -1), (0.43, 1)):
    uv("EarOuter", (x, 0.02, 2.96), (0.23, 0.18, 0.36), MATS["orange"], parent=head_rig)
    uv("EarInner", (x, -0.12, 2.98), (0.11, 0.055, 0.22), MATS["cream"], segments=16, rings=10, parent=head_rig)
    cone("Horn", (x + sign * 0.10, -0.03, 3.26), 0.115, 0.018, 0.48, MATS["cream"], rotation=(0, sign * -0.38, 0), parent=head_rig)

# Mint work beacon, echoing the existing Niuma logo accent.
cyl("BeaconStem", (0.0, 0.0, 3.18), 0.035, 0.20, MATS["charcoal"], parent=head_rig)
uv("Beacon", (0.0, 0.0, 3.34), (0.12, 0.12, 0.12), MATS["mint"], segments=16, rings=10, parent=head_rig)

# Dark mane along the back.
for i, z in enumerate((2.72, 2.43, 2.14, 1.85, 1.56, 1.27)):
    uv(f"Mane{i}", (0.0, 0.43, z), (0.22, 0.16, 0.20), MATS["orange_dark"], segments=16, rings=10, parent=root)

# Four short legs and hooves.
for x, y, rig in ((-0.42, -0.26, left_arm_rig), (0.42, -0.26, right_arm_rig), (-0.42, 0.28, root), (0.42, 0.28, root)):
    cyl("Leg", (x, y, 0.77), 0.16, 0.72, MATS["orange"], parent=rig)
    uv("Hoof", (x, y - 0.035, 0.35), (0.22, 0.25, 0.14), MATS["hoof"], segments=16, rings=10, parent=rig)

# Small mint badge on the chest.
uv("WorkBadge", (0.0, -0.66, 1.68), (0.16, 0.055, 0.16), MATS["mint"], segments=16, rings=10, parent=root)

# Tail with a darker tuft.
cyl("TailBase", (0.0, 0.62, 1.67), 0.10, 0.42, MATS["orange"], rotation=(math.radians(65), 0, 0), parent=tail_rig)
uv("TailTuft", (0.0, 0.91, 1.88), (0.22, 0.17, 0.26), MATS["orange_dark"], segments=16, rings=10, parent=tail_rig)

# Give joints anatomically local origins while preserving their rest-pose geometry.
for rig, origin in ((head_rig, (0, 0, 2.32)), (tail_rig, (0, .5, 1.67)),
                    (left_arm_rig, (-.42, -.26, 1.1)), (right_arm_rig, (.42, -.26, 1.1))):
    for child in rig.children:
        child.location -= Vector(origin)
    rig.location = origin

export_glb(root, "niuma.glb")
render_poster("niuma.png", look_at=(0, 0, 1.65), camera=(3.3, -8.0, 3.1), ortho_scale=3.95)
print(f"created {GLB_PATH}")
print(f"created {POSTER_PATH}")
