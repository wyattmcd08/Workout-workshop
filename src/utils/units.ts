import type { UnitSystem } from '@/types'

const LB_PER_KG = 2.2046226218

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}

export function weightUnitLabel(system: UnitSystem): string {
  return system === 'metric' ? 'kg' : 'lb'
}

/** Convert stored kilograms into the user's display unit. */
export function toDisplayWeight(weightKg: number, system: UnitSystem): number {
  return system === 'metric' ? weightKg : kgToLb(weightKg)
}

/** Convert a user-entered weight in their display unit back to kilograms. */
export function fromDisplayWeight(value: number, system: UnitSystem): number {
  return system === 'metric' ? value : lbToKg(value)
}

export function formatWeight(weightKg: number, system: UnitSystem, decimals = 1): string {
  const value = toDisplayWeight(weightKg, system)
  return `${trimZeros(value.toFixed(decimals))} ${weightUnitLabel(system)}`
}

function trimZeros(value: string): string {
  return value.replace(/\.0+$/, '')
}
