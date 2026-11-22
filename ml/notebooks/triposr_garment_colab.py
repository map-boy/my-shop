# Run in Google Colab (Runtime > T4 GPU). One cell per block.
# 1) !git clone https://github.com/VAST-AI-Research/TripoSR && cd TripoSR && pip install -q -r requirements.txt
# 2) upload garment.png (one garment, plain background, front view)
# 3) !cd TripoSR && python run.py ../garment.png --output-dir ../out --model-save-format glb --mc-resolution 192
# 4) from google.colab import files; files.download('out/0/mesh.glb')
# Then on this PC:
#   npx @gltf-transform/cli simplify mesh.glb s.glb --ratio 0.15 ; npx @gltf-transform/cli webp s.glb final.glb --quality 80
#   upload final.glb (under 4 MB) in Admin > Product > Images & video > 3D model