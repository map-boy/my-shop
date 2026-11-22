import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type P3 = { x: number; y: number; z: number };
const SHOULDER_M = 0.40;

export class Garment3D {
  private r: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(0, 1, 0, 1, -2000, 2000);
  private root = new THREE.Group();
  private yaw = 0;
  constructor(canvas: HTMLCanvasElement) {
    this.r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.r.setClearColor(0x000000, 0);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const d = new THREE.DirectionalLight(0xffffff, 1.2); d.position.set(0.3, -1, 1); this.scene.add(d);
    this.scene.add(this.root); this.root.visible = false;
  }
  async load(url: string) {
    const g = await new GLTFLoader().loadAsync(url);
    this.root.clear(); this.root.add(g.scene); this.root.visible = true;
  }
  resize(w: number, h: number) {
    this.r.setSize(w, h, false);
    Object.assign(this.cam, { left: 0, right: w, top: 0, bottom: h }); this.cam.updateProjectionMatrix();
  }
  /** img: normalized image landmarks; world: MediaPipe worldLandmarks (metres). */
  update(img: P3[], world: P3[], w: number, h: number) {
    const L = img[11], R = img[12];
    if (!L || !R || !this.root.children.length) { this.root.visible = false; return; }
    const lx = L.x * w, ly = L.y * h, rx = R.x * w, ry = R.y * h;
    const spx = Math.hypot(rx - lx, ry - ly), s = spx / SHOULDER_M;
    let ddx = rx - lx, ddy = ry - ly; if (ddx < 0) { ddx = -ddx; ddy = -ddy; }
    const roll = Math.atan2(ddy, ddx);
    const wl = world[11], wr = world[12];
    const yawRaw = wl && wr ? Math.atan2(wl.z - wr.z, wl.x - wr.x) : 0;
    const lim = Math.PI / 3;
    this.yaw += (Math.max(-lim, Math.min(lim, yawRaw)) - this.yaw) * 0.3;
    this.root.visible = true;
    this.root.position.set((lx + rx) / 2, (ly + ry) / 2 - 0.04 * s, 0);
    this.root.scale.set(s, -s, s);
    this.root.rotation.set(0, this.yaw, roll);
  }
  hide() { this.root.visible = false; }
  render() { this.r.render(this.scene, this.cam); }
  dispose() { this.r.dispose(); }
}