import type { PoseLandmarker } from '@mediapipe/tasks-vision';
// Loaded from a CDN at runtime: nothing is stored in the repo or on disk. Keep VER equal to the installed package.
const VER = '0.10.14';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
let p: Promise<PoseLandmarker> | null = null;
async function make() {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
  const files = await FilesetResolver.forVisionTasks(WASM);
  const open = (delegate: 'GPU' | 'CPU') => PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numPoses: 1 });
  try { return await open('GPU'); } catch { return await open('CPU'); }
}
export function loadPose() { return (p ??= make().catch((e) => { p = null; throw e; })); }