# try-on (live virtual fitting)

Customer opens the camera on a product page and sees the garment on their own body, in real time, on the phone. Camera frames never leave the device.

Flag: `VITE_FEATURE_TRY_ON=true` (build time). Route: `/try-on?p=<slug>&img=<photo>[&embed=1]`.

## Status

| Part | State |
| --- | --- |
| Live camera, MediaPipe pose, size/fit verdict (shoulders, chest, length) | done |
| Real-time loop: detect ~30 fps, draw every frame, EMA smoothing, landmarks older than 400 ms dropped | done |
| Embed on other sites (`public/try-on-embed.js`, iframe, `embed=1` hides storefront chrome) | done |
| 2D garment cut-out from the product photo (tap-point model, multiclass fallback, flood-fill fallback) | done, limited quality |
| Head/neck drawn in front of garment (2D occlusion) | in progress, unverified |
| Photo mode (upload or phone-camera photo) + Take picture (saves or shares the result) | done |
| **3D garment (three.js + GLB), turns with the person** | **planned, not built** |

## Folder map

```
camera/      useCamera: getUserMedia, front/back switch
pose/        MediaPipe PoseLandmarker (GPU, CPU fallback), usePoseLoop, landmarks, drawOverlay
fit/         measure, stabilize, compare, size chart, useFitSession (cm estimates and verdicts)
garment/     2D path: segment.ts, cutout.ts, drawGarment.ts, useGarment.ts
components/  TryOnPanel, CameraView, FitVerdict, HeightPrompt, TryOnButton
```

## Current 2D pipeline

1. Pose gives 33 landmarks; `measure.ts` scales pixels to cm from the user's height.
2. `segment.ts` cuts the garment out of the product photo: magic_touch tap-point model, then selfie_multiclass connected piece, then `cutout.ts` flood fill. If all fail nothing is drawn (never the raw photo).
3. `drawGarment.ts` places the cut-out on shoulders/hips at true cm size, smoothed.
4. Pixel access to Firebase Storage images needs CORS: `api/img.mjs` (same-origin proxy, firebasestorage hosts only) or `gsutil cors set cors.json gs://my-shop-84749.firebasestorage.app`.

Known limits of 2D (why 3D is next): one flat photo has no side or back, so it cannot turn with the person; mannequin photos with busy backgrounds leave skin/shading artifacts; it always looks like a sticker.

## Embed on other sites

```html
<script src="https://karibu.fit/try-on-embed.js" data-product="<slug>" data-img="<optional photo url>"></script>
```

Opens `/try-on?p=<slug>&embed=1` in an iframe with `allow="camera"`. `vercel.json` sets `Permissions-Policy: camera=*` and `frame-ancestors *` for `/try-on` only. Needs https. Local test: `tools/embed-test.html` (not committed).

## 3D plan (target)

Goal: the person can move, turn and step closer, and the garment follows like real clothing.

**Rendering**
- three.js in a transparent canvas over the video, same size and mirroring as `CameraView`.
- MediaPipe `worldLandmarks` (metric 3D) drive position, rotation and scale; shoulders and hips define the torso frame.
- Garment is a rigged or skinned GLB. Simple tops/dresses: bind to a torso skeleton (chest, hips, shoulders) and bend with the pose.
- Occlusion: invisible body proxy (head, neck, arms) written to the depth buffer, so head and arms stay in front of the garment.
- Lighting: neutral HDRI plus one directional light; later match brightness to the camera feed.
- Smoothing: One-Euro filter on landmarks, quaternion slerp on rotation.

**Data**
- Product gets `model3d?: string` (GLB URL in Firebase Storage) and `model3dScale?` (optional cm calibration).
- Admin Product editor: GLB upload field. Products without a GLB keep the 2D path.
- GLB limits: under 5 MB, under 50k triangles, Draco/meshopt compressed, textures 1024 px.

**Free tool chain**
- three.js, MediaPipe, Blender, glTF-Transform (compression), Firebase Storage.
- Image-to-3D for first drafts: TripoSR or Hugging Face spaces, run on free Colab GPU. Free usage limits apply.
- Input photo must be a clean garment on a plain background. Every generated model is cleaned in Blender (mesh, scale, rig) before publishing.

**Phases**
1. Prototype: one garment GLB, three.js layer over the video, follows shoulders/hips. Measure fps on a mid-range phone.
2. Worn look: depth occlusion proxy, skeleton bend, smoothing.
3. Turning: use pose yaw to rotate the model; fade out or lock rotation past about 60 degrees.
4. Admin upload, per-product GLB, fallback to 2D.
5. Quality gate and rollout to more products.

**Acceptance (phase 1 to 2)**
- At least 24 fps on a mid-range Android phone.
- Garment stays attached to shoulders while the person walks left/right and steps closer/back.
- Head and arms render in front of the garment.
- No raw photo ever drawn.

**Risks**
- Free image-to-3D quality is uneven; budget Blender cleanup per garment.
- Loose fabric (dresses) needs more than a rigid mesh; start with fitted tops.
- Back of the garment is invented by the model; label it as an estimate.

## Tuning constants

`fit/constants.ts` (body ratios, fit limits), `garment/constants.ts` (SLEEVE_K, COLLAR_CM, EMA, CUT_TOL, MAX_PX).

## Privacy

Pose and segmentation run on the device. Models load from jsDelivr and storage.googleapis.com. No camera frames are uploaded.
## Photo mode and Take picture
- "Use my photo": file input (`accept=image/*`; on phones it offers camera or gallery). The photo is scaled to 1280 px, pose runs on it (`detectForVideo` on a canvas, 3 passes), 20 identical samples feed `useFitSession` so size verdicts work, then the garment is drawn once on the photo canvas. Needs a visible person; otherwise `photoNoBody` is shown.
- "Take picture": composites the live video (mirrored when the front camera is used) with the garment canvas, or exports the photo canvas, as JPEG. Uses Web Share with files where supported, else downloads `karibu-try-on.jpg`.
- "Open camera" clears the photo and returns to live mode. Images never leave the device.

## 3D phase 1 scaffold (added)
- `ml/tools/garment_to_glb.py`: garment photo -> grabCut silhouette -> earcut mesh (front, back, side wall) -> textured double-sided GLB. Run: `python ml/tools/garment_to_glb.py in.jpg out.glb --width-cm 52`. Needs `pip install trimesh shapely mapbox-earcut`. Back is a mirror estimate. Clean in Blender before publishing.
- `three/Garment3D.ts`: three.js overlay (ortho pixel camera). `load(glbUrl)`, `resize(w,h)`, `update(imgLandmarks, worldLandmarks, w, h)`, `render()`. Yaw from shoulder world z, clamped to 60 degrees. Not yet wired into TryOnPanel; no `model3d` field on Product yet.

## 3D wiring (added)
- `usePoseLoop` now passes `worldLandmarks` as 2nd arg of `onLms`. `TryOnPanel` takes `model3dUrl`; lazy-loads `three/Garment3D`, loads the GLB via `/api/img?u=` (proxy also allows `.glb` now, keep GLB under 4 MB for Vercel). When a GLB is loaded the 2D garment is skipped; 3D canvas sits above the overlay canvas in `CameraView`. `Product.model3d?: string` added to `shared/lib/types.ts`.
- Still open: pass `model3d` from `TryOnPage`, GLB upload in `ProductEditor`, firestore.rules field check, depth occlusion proxy (head/neck currently covered by 3D), photo mode stays 2D.

- TryOnPage now passes product.model3d to TryOnPanel as model3dUrl.

- Admin: shared/components/GlbInput.tsx in ProductEditor (media tab) saves model3d; upload.ts sets contentType model/gltf-binary for .glb; storage.rules allows it (deploy: 
px firebase-tools deploy --only storage --project my-shop-84749). GLB limit 4 MB (Vercel proxy).

- Fixed: roll/yaw in Garment3D.update now use left-minus-right shoulder direction (was ~180 deg off). Dev test: /try-on?dev=1&p=x&glb=/dev-glb/g1.glb loads a same-origin GLB from public/dev-glb/ (git-excluded). If the garment turns the wrong way, negate yawRaw.
