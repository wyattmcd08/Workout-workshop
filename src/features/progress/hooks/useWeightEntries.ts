import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import type { WeightEntry } from '@/types'
import { dateKeyDaysAgo, todayKey } from '@/utils/date'
import { createId } from '@/utils/id'

export function useWeightEntries(days = 90): WeightEntry[] | undefined {
  return useLiveQuery(async () => {
    const since = dateKeyDaysAgo(days)
    const entries = await db.weightEntries.where('dateKey').aboveOrEqual(since).sortBy('dateKey')
    return entries
  }, [days])
}

/** Adds today's weigh-in, replacing an earlier one from the same day. */
export async function logWeight(weightKg: number): Promise<void> {
  const dateKey = todayKey()
  await db.transaction('rw', db.weightEntries, async () => {
    const existing = await db.weightEntries.where('dateKey').equals(dateKey).first()
    if (existing) {
      await db.weightEntries.update(existing.id, { weightKg, loggedAt: Date.now() })
    } else {
      await db.weightEntries.add({ id: createId(), dateKey, weightKg, loggedAt: Date.now() })
    }
  })
}
