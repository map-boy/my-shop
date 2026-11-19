import type { Body, FitResult, SizeRow, Verdict, Zone } from './types.ts';
import { LENGTH_K, LIM } from './constants.ts';
const verdict = (z: Zone, d: number): Verdict => (d < LIM[z].tight ? 'tight' : d > LIM[z].loose ? 'loose' : 'fits');
export function fitOne(b: Body, r: SizeRow): FitResult {
  const chestMid = (b.chestCm[0] + b.chestCm[1]) / 2;
  const d: Record<Zone, number> = { shoulders: r.shoulderCm - b.shoulderCm, chest: r.chestCm - chestMid, length: r.lengthCm - b.torsoCm * LENGTH_K };
  const zones = (Object.keys(d) as Zone[]).map((zone) => ({ zone, diffCm: d[zone], verdict: verdict(zone, d[zone]) }));
  const score = zones.reduce((s, z) => s + Math.abs(z.diffCm - LIM[z.zone].target), 0);
  const overall: Verdict = zones.some((z) => z.verdict === 'tight') ? 'tight' : zones.filter((z) => z.verdict === 'loose').length >= 2 ? 'loose' : 'fits';
  return { size: r.size, zones, overall, score };
}
export function fitAll(b: Body, chart: SizeRow[]) {
  const rows = chart.map((r) => fitOne(b, r));
  const pool = rows.filter((r) => r.overall === 'fits');
  const best = (pool.length ? pool : rows).reduce((a, c) => (c.score < a.score ? c : a)).size;
  return { rows, best };
}