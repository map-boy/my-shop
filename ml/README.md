# ml/ (never bundled into the web app)

data/ (gitignored) -> notebooks/ -> training/ -> export/ (ONNX/TFJS)
Weights live on Hugging Face (umwe), not in git.
The web app loads the exported model from a URL, see src/features/try-on.
