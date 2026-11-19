import type { SizeRow } from './types.ts';
/** Generic tops chart. Per-product charts replace this later. */
export const DEFAULT_CHART: SizeRow[] = [
  { size: 'S', shoulderCm: 42, chestCm: 98, lengthCm: 68 },
  { size: 'M', shoulderCm: 44, chestCm: 104, lengthCm: 70 },
  { size: 'L', shoulderCm: 46, chestCm: 110, lengthCm: 72 },
  { size: 'XL', shoulderCm: 48, chestCm: 116, lengthCm: 74 },
  { size: 'XXL', shoulderCm: 50, chestCm: 122, lengthCm: 76 },
];