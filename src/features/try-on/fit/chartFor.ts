import type { SizeRow } from './types.ts';
import { DEFAULT_CHART } from './sizeChart.ts';
/** Product's own size values (e.g. S, M, L) -> matching rows of the default chart. Falls back to the full chart. */
export function chartFor(values?: string[]): SizeRow[] {
  if (!values?.length) return DEFAULT_CHART;
  const set = new Set(values.map((v) => v.trim().toUpperCase()));
  const rows = DEFAULT_CHART.filter((r) => set.has(r.size));
  return rows.length >= 2 ? rows : DEFAULT_CHART;
}