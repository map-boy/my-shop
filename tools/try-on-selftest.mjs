import assert from 'node:assert/strict';
import { fitAll } from '../src/features/try-on/fit/compare.ts';
import { DEFAULT_CHART } from '../src/features/try-on/fit/sizeChart.ts';
const a = fitAll({ shoulderCm: 44, chestCm: [96, 108], torsoCm: 52, cmPerPx: 0.2 }, DEFAULT_CHART);
assert.equal(a.best, 'L'); assert.equal(a.rows[0].overall, 'tight'); assert.equal(a.rows[2].overall, 'fits');
const b = fitAll({ shoulderCm: 36, chestCm: [80, 90], torsoCm: 44, cmPerPx: 0.2 }, DEFAULT_CHART);
assert.equal(b.best, 'S'); assert.equal(b.rows[0].overall, 'loose');
console.log('try-on selftest OK');