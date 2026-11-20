# try-on (camera fit check)
subfolders to add: camera/ fit/ components/ services/
Runs on-device, camera frames are never uploaded.

## Real time
Pose detection ~30 fps (GPU delegate). A separate requestAnimationFrame loop draws the garment every frame; drawGarment EMA-smooths between detections. Landmarks older than 400 ms are dropped.

## Embed on other sites
<script src="https://karibu.fit/try-on-embed.js" data-product="<slug>" data-img="<optional photo url>"></script>
Opens /try-on?p=<slug>&embed=1 in an iframe with allow="camera". vercel.json sets Permissions-Policy camera=* and frame-ancestors * for /try-on only. Needs https.

With &embed=1 the storefront chrome (navbar, footer, cart drawer) is hidden so the page fits inside the iframe.
