import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyTargets, UnitSystem, UserProfile } from '@/types'
import { DEFAULT_PROFILE } from '@/types'

interface SettingsState {
  profile: UserProfile
  setName: (name: string) => void
  setUnitSystem: (unitSystem: UnitSystem) => void
  setTargets: (targets: DailyTargets) => void
  setWeeklyWorkoutGoal: (goal: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      setName: (name) => set((state) => ({ profile: { ...state.profile, name } })),
      setUnitSystem: (unitSystem) =>
        set((state) => ({ profile: { ...state.profile, unitSystem } })),
      setTargets: (targets) => set((state) => ({ profile: { ...state.profile, targets } })),
      setWeeklyWorkoutGoal: (weeklyWorkoutGoal) =>
        set((state) => ({ profile: { ...state.profile, weeklyWorkoutGoal } })),
    }),
    { name: 'dialed-dawg-settings' },
  ),
)

export function useUnitSystem(): UnitSystem {
  return useSettingsStore((state) => state.profile.unitSystem)
}

export function useDailyTargets(): DailyTargets {
  return useSettingsStore((state) => state.profile.targets)
}
