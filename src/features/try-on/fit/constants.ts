/** All tunable numbers live here. Single-camera estimates are rough on purpose. */
export const NOSE_ANKLE_RATIO = 0.88; // nose-to-ankle span as a share of standing height
export const SEAM_CM = 3;             // shoulder joint width -> garment shoulder seam width
export const CHEST_K: [number, number] = [2.4, 2.8]; // chest circumference = joint width * k
export const SHOULDER_RATIO = 0.245; // close-up scale: shoulder joint width as a share of height (preview only)
export const LENGTH_K = 1.3;          // ideal top length = shoulder-hip torso * k
export const LIM = {
  shoulders: { tight: -1, loose: 5, target: 1.5 },
  chest: { tight: 2, loose: 14, target: 7 },
  length: { tight: -5, loose: 7, target: 1.5 },
} as const;