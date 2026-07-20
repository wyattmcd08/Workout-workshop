/** Tier color for a 0–100 readiness score, shared by map, rings, and bars. */
export function readinessTierColor(readiness: number): string {
  if (readiness >= 70) return 'var(--color-accent)'
  if (readiness >= 40) return 'var(--color-yellow)'
  return 'var(--color-red)'
}
