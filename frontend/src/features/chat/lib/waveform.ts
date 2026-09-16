export const WAVEFORM_BARS = 40;

/** Сжимает записанные уровни громкости до фиксированного числа столбиков и нормирует по пику */
export function buildWaveform(levels: readonly number[], bars = WAVEFORM_BARS): number[] {
  if (levels.length === 0) return Array<number>(bars).fill(0);

  const bucketSize = levels.length / bars;
  const values = Array.from({ length: bars }, (_, index) => {
    const start = Math.floor(index * bucketSize);
    const end = Math.max(start + 1, Math.floor((index + 1) * bucketSize));
    return Math.max(...levels.slice(start, end));
  });

  const peak = Math.max(...values, 0.01);
  return values.map((value) => Math.round((value / peak) * 100) / 100);
}
