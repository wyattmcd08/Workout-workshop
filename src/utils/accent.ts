import type { AccentColor } from '@/types'

/** Each accent maps to a solid color and a translucent "muted" variant. */
export const ACCENT_COLORS: Record<AccentColor, { solid: string; muted: string; label: string }> = {
  green: { solid: '#30d158', muted: 'rgb(48 209 88 / 0.14)', label: 'Green' },
  blue: { solid: '#0a84ff', muted: 'rgb(10 132 255 / 0.14)', label: 'Blue' },
  teal: { solid: '#64d2ff', muted: 'rgb(100 210 255 / 0.14)', label: 'Teal' },
  purple: { solid: '#bf5af2', muted: 'rgb(191 90 242 / 0.14)', label: 'Purple' },
  pink: { solid: '#ff375f', muted: 'rgb(255 55 95 / 0.14)', label: 'Pink' },
  orange: { solid: '#ff9f0a', muted: 'rgb(255 159 10 / 0.14)', label: 'Orange' },
}

export const ACCENT_OPTIONS = Object.keys(ACCENT_COLORS) as AccentColor[]

/**
 * Overrides the `--color-accent` design tokens at runtime so the whole app
 * re-themes instantly. Falls back to green for an unknown key.
 */
export function applyAccentColor(accent: AccentColor): void {
  const value = ACCENT_COLORS[accent] ?? ACCENT_COLORS.green
  const root = document.documentElement
  root.style.setProperty('--color-accent', value.solid)
  root.style.setProperty('--color-accent-muted', value.muted)
}
