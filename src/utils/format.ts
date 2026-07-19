/** Compact number formatting for stat displays: 12,450 → 12.4k. */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return Math.round(value).toLocaleString()
}

export function formatSigned(value: number, decimals = 1): string {
  const rounded = value.toFixed(decimals).replace(/\.0+$/, '')
  return value > 0 ? `+${rounded}` : rounded
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
