"""Garment photo -> textured double-sided GLB mesh.  python ml/tools/garment_to_glb.py in.jpg out.glb --width-cm 52
Input: one garment on a plain background, front view. Back = same texture (estimate)."""
import argparse, numpy as np, cv2, trimesh
from PIL import Image
from shapely.geometry import Polygon
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--width-cm', type=float, default=52.0)
ap.add_argument('--thick-cm', type=float, default=1.5)
ap.add_argument('--eps', type=float, default=0.002)
ap.add_argument('--rembg', action='store_true', help='AI background removal (better than grabCut)')
a = ap.parse_args()

img = cv2.imread(a.src, cv2.IMREAD_COLOR)
assert img is not None, 'cannot read image'
h0, w0 = img.shape[:2]; k = 1024 / max(h0, w0)
if k < 1: img = cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
h, w = img.shape[:2]

mask = np.zeros((h, w), np.uint8)
cv2.grabCut(img, mask, (int(w*.03), int(h*.03), int(w*.94), int(h*.94)), np.zeros((1,65)), np.zeros((1,65)), 6, cv2.GC_INIT_WITH_RECT)
m = (((mask == 1) | (mask == 3)).astype(np.uint8)) * 255
if a.rembg:
    from rembg import remove, new_session
    m = np.array(remove(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)), session=new_session('silueta'), only_mask=True))
    m = ((m > 127).astype(np.uint8)) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7,7), np.uint8))
m = cv2.erode(m, np.ones((3,3), np.uint8), iterations=2)
cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cs, key=cv2.contourArea)
pts = cv2.approxPolyDP(c, a.eps * cv2.arcLength(c, True), True)[:, 0, :].astype(float)
x, y, bw, bh = cv2.boundingRect(c)
s = (a.width_cm / 100.0) / bw; cx = x + bw / 2.0; top = float(y)
P = Polygon(np.c_[(pts[:,0]-cx)*s, -(pts[:,1]-top)*s])
if not P.is_valid: P = P.buffer(0)
v2, f = trimesh.creation.triangulate_polygon(P, engine='earcut')
n = len(v2); t = a.thick_cm / 100.0 / 2
V = np.r_[np.c_[v2, np.full(n, t)], np.c_[v2, np.full(n, -t)]]
F = [f, f[:, ::-1] + n]
e = np.sort(np.r_[f[:, [0,1]], f[:, [1,2]], f[:, [2,0]]], axis=1)
u, cnt = np.unique(e, axis=0, return_counts=True)
for p, q in u[cnt == 1]:
    F += [np.array([[p, q, q+n], [p, q+n, p+n]])]
F = np.vstack(F)
px = v2[:,0]/s + cx; py = -v2[:,1]/s + top
uv1 = np.c_[px / w, 1 - py / h]; UV = np.r_[uv1, uv1]
rgba = np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), m])
mat = PBRMaterial(baseColorTexture=Image.fromarray(rgba, 'RGBA'), alphaMode='MASK', alphaCutoff=0.5, doubleSided=True, metallicFactor=0.0, roughnessFactor=1.0)
mesh = trimesh.Trimesh(V, F, visual=TextureVisuals(uv=UV, material=mat), process=False)
mesh.export(a.out)
print('ok', a.out, 'verts', len(V), 'tris', len(F), 'bbox_m', np.round(mesh.extents, 3))