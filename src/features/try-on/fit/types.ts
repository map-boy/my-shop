export interface Pt { x: number; y: number; visibility?: number }
export type Zone = 'shoulders' | 'chest' | 'length';
export type Verdict = 'tight' | 'fits' | 'loose';
/** Estimated body, cm. chestCm is a circumference range. cmPerPx = image scale. */
export interface Body { shoulderCm: number; chestCm: [number, number]; torsoCm: number; cmPerPx: number }
/** Garment chart row, cm. chestCm = garment circumference. */
export interface SizeRow { size: string; shoulderCm: number; chestCm: number; lengthCm: number }
export interface ZoneResult { zone: Zone; verdict: Verdict; diffCm: number }
export interface FitResult { size: string; zones: ZoneResult[]; overall: Verdict; score: number }