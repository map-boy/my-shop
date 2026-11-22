# ml/ (never bundled into the web app)

data/ (gitignored) -> notebooks/ -> training/ -> export/ (ONNX/TFJS)
Weights live on Hugging Face (umwe), not in git.
The web app loads the exported model from a URL, see src/features/try-on.

meshing: ml/tools/garment_to_glb.py (garment photo -> GLB for the 3D try-on).

triposr: ml/notebooks/triposr_garment_colab.py (image-to-3D on free Colab GPU, produces real garment GLB). Status of 3D: src/features/try-on/README.md > 3D progress.
