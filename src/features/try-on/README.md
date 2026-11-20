# try-on (camera fit check)
subfolders to add: camera/ fit/ components/ services/
Runs on-device, camera frames are never uploaded.

## Real time
Pose detection ~30 fps (GPU delegate). A separate requestAnimationFrame loop draws the garment every frame; drawGarment EMA-smooths between detections. Landmarks older than 400 ms are dropped.

## Embed on other sites
<script src="https://karibu.fit/try-on-embed.js" data-product="<slug>" data-img="<optional photo url>"></script>
Opens /try-on?p=<slug>&embed=1 in an iframe with allow="camera". vercel.json sets Permissions-Policy camera=* and frame-ancestors * for /try-on only. Needs https.

With &embed=1 the storefront chrome (navbar, footer, cart drawer) is hidden so the page fits inside the iframe.

## Garment cut-out (fit, not a picture)
garment/segment.ts runs MediaPipe selfie_multiclass and keeps only the clothes pixels, so mannequin / worn photos with busy backgrounds become a transparent garment that is then sized to the body. Fallback: flood-fill cutout.ts for flat-lay photos. If neither works the garment is not drawn (no raw photo). Pixel access needs CORS: api/img.mjs (same-origin proxy, firebasestorage hosts only) or `gsutil cors set cors.json gs://my-shop-84749.firebasestorage.app`.

## Garment cut-out v2
segment.ts order: (1) MediaPipe magic_touch tap-point model, tapped at image centre (0.5, 0.55), gives only the main garment, no neighbours; (2) selfie_multiclass clothes mask, keeping only the connected piece nearest the centre; (3) flood-fill cutout.ts. If all fail nothing is drawn (no raw photo). drawGarment keeps the cut-out's own aspect ratio: width from chest size, height from the image proportions, so dresses are not squashed to top length. Tested on a mannequin photo with a busy shop background (tools/segprobe.html, not committed).

segment.ts: after the tap-point mask, dropSkin() removes pixels the multiclass model labels hair / body-skin / face-skin, so mannequin neck, shoulders and arms are not drawn on the customer; only fabric remains.
