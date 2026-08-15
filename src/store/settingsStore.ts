import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AccentColor, DailyTargets, HomeWidgets, UnitSystem, UserProfile } from '@/types'
import { DEFAULT_PROFILE } from '@/types'

interface SettingsState {
  profile: UserProfile
  setName: (name: string) => void
  setUnitSystem: (unitSystem: UnitSystem) => void
  setTargets: (targets: DailyTargets) => void
  setWeeklyWorkoutGoal: (goal: number) => void
  setDefaultRestSeconds: (seconds: number) => void
  setAccentColor: (accentColor: AccentColor) => void
  setHomeWidget: (key: keyof HomeWidgets, visible: boolean) => void
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
      setDefaultRestSeconds: (defaultRestSeconds) =>
        set((state) => ({ profile: { ...state.profile, defaultRestSeconds } })),
      setAccentColor: (accentColor) =>
        set((state) => ({ profile: { ...state.profile, accentColor } })),
      setHomeWidget: (key, visible) =>
        set((state) => ({
          profile: { ...state.profile, homeWidgets: { ...state.profile.homeWidgets, [key]: visible } },
        })),
    }),
    {
      name: 'dialed-dawg-settings',
      // Backfill fields added after a user's settings were first persisted.
      merge: (persisted, current) => {
        const stored = (persisted as Partial<SettingsState> | undefined)?.profile
        return {
          ...current,
          profile: {
            ...DEFAULT_PROFILE,
            ...stored,
            targets: { ...DEFAULT_PROFILE.targets, ...stored?.targets },
            homeWidgets: { ...DEFAULT_PROFILE.homeWidgets, ...stored?.homeWidgets },
          },
        }
      },
    },
  ),
)

export function useUnitSystem(): UnitSystem {
  return useSettingsStore((state) => state.profile.unitSystem)
}

export function useDailyTargets(): DailyTargets {
  return useSettingsStore((state) => state.profile.targets)
}
