"""Garment photo -> volumetric (inflated) double-sided GLB. python ml/tools/garment_to_glb_inflate.py in.png out.glb --width-cm 52 --depth-cm 9 --rembg"""
import argparse, numpy as np, cv2, trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals
ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--width-cm', type=float, default=52.0)
ap.add_argument('--depth-cm', type=float, default=9.0, help='half-thickness at the centre')
ap.add_argument('--step', type=int, default=8, help='grid size in px')
ap.add_argument('--rembg', action='store_true')
a = ap.parse_args()
img = cv2.imread(a.src, cv2.IMREAD_COLOR); assert img is not None, 'cannot read image'
k = 1024 / max(img.shape[:2])
if k < 1: img = cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
h, w = img.shape[:2]
if a.rembg:
    from rembg import remove, new_session
    m = np.array(remove(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)), session=new_session('silueta'), only_mask=True))
    m = ((m > 127).astype(np.uint8)) * 255
else:
    g = np.zeros((h, w), np.uint8)
    cv2.grabCut(img, g, (int(w*.03), int(h*.03), int(w*.94), int(h*.94)), np.zeros((1,65)), np.zeros((1,65)), 6, cv2.GC_INIT_WITH_RECT)
    m = (((g == 1) | (g == 3)).astype(np.uint8)) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7,7), np.uint8)); m = cv2.erode(m, np.ones((3,3), np.uint8), iterations=2)
cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
c = max(cs, key=cv2.contourArea); m = np.zeros((h, w), np.uint8); cv2.drawContours(m, [c], -1, 255, -1)
dist = cv2.distanceTransform(m, cv2.DIST_L2, 5); dm = float(dist.max()) or 1.0
x, y, bw, bh = cv2.boundingRect(c); s = (a.width_cm / 100.0) / bw; cx = x + bw / 2.0; top = float(y)
xs = np.clip(np.arange(x, x + bw + a.step, a.step), 0, w - 1); ys = np.clip(np.arange(y, y + bh + a.step, a.step), 0, h - 1)
gx, gy = np.meshgrid(xs, ys)
inside = m[gy, gx] > 0
idx = -np.ones(gx.shape, int); idx[inside] = np.arange(int(inside.sum()))
px = gx[inside].astype(float); py = gy[inside].astype(float)
Z = (a.depth_cm / 100.0) * np.sqrt(dist[gy[inside], gx[inside]] / dm)
X = (px - cx) * s; Y = -(py - top) * s; n = len(X)
V = np.r_[np.c_[X, Y, Z], np.c_[X, Y, -Z]]
ok = (idx[:-1,:-1] >= 0) & (idx[:-1,1:] >= 0) & (idx[1:,:-1] >= 0) & (idx[1:,1:] >= 0)
A = idx[:-1,:-1][ok]; B = idx[:-1,1:][ok]; C = idx[1:,:-1][ok]; D = idx[1:,1:][ok]
F = np.r_[np.c_[A, C, B], np.c_[B, C, D]]; F = np.r_[F, F[:, ::-1] + n]
uv = np.c_[px / w, 1 - py / h]; UV = np.r_[uv, uv]
rgba = np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), m])
mat = PBRMaterial(baseColorTexture=Image.fromarray(rgba, 'RGBA'), alphaMode='MASK', alphaCutoff=0.5, doubleSided=True, metallicFactor=0.0, roughnessFactor=1.0)
mesh = trimesh.Trimesh(V, F, visual=TextureVisuals(uv=UV, material=mat), process=False)
_ = mesh.vertex_normals
mesh.export(a.out)
print('ok', a.out, 'verts', len(V), 'tris', len(F), 'bbox_m', np.round(mesh.extents, 3))