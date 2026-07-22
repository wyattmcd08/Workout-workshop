import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import type { WeightEntry } from '@/types'
import { dateKeyDaysAgo, todayKey } from '@/utils/date'

export function useWeightEntries(days = 90): WeightEntry[] | undefined {
  const weightEntries = useDataStore((s) => s.weightEntries)
  return useMemo(() => {
    const since = dateKeyDaysAgo(days)
    return weightEntries
      .filter((e) => e.dateKey >= since)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [weightEntries, days])
}

/** Adds today's weigh-in, replacing an earlier one from the same day. */
export async function logWeight(weightKg: number): Promise<void> {
  useDataStore.getState().upsertWeightForDay(todayKey(), weightKg)
}
