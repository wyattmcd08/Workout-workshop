import { useDataStore, type LegacyImport } from '@/store/dataStore'

/**
 * One-time, best-effort import of data from the old IndexedDB (Dexie)
 * database into the localStorage-backed store, for users who created data
 * before the storage layer was replaced.
 *
 * Uses the native `getAll()` request (a single read, no cursor) so it can
 * succeed even on the iOS WebKit builds where opening a *cursor* was the
 * failing operation. Every step is guarded and time-boxed: a failure or a
 * hung connection can never block startup or crash the app — the user simply
 * starts with an empty (but fully working) store.
 */
const LEGACY_DB_NAME = 'dialed-dawg'
const MIGRATION_FLAG = 'dialed-dawg-idb-migrated'
const STORE_NAMES = [
  'workouts',
  'templates',
  'foods',
  'foodLogs',
  'waterLogs',
  'weightEntries',
  'muscleRecovery',
  'exercises',
] as const

const OPEN_TIMEOUT_MS = 2000
const READ_TIMEOUT_MS = 2000

function openLegacyDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (value: IDBDatabase | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    try {
      const request = indexedDB.open(LEGACY_DB_NAME)
      request.onsuccess = () => finish(request.result)
      request.onerror = () => finish(null)
      request.onblocked = () => finish(null)
      // If the database did not already exist, opening it triggers an
      // upgrade; abort so we neither create junk nor treat it as real data.
      request.onupgradeneeded = () => {
        try {
          request.transaction?.abort()
        } catch {
          /* ignore */
        }
        finish(null)
      }
      setTimeout(() => finish(null), OPEN_TIMEOUT_MS)
    } catch {
      finish(null)
    }
  })
}

function readStore(db: IDBDatabase, storeName: string): Promise<unknown[]> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (rows: unknown[]) => {
      if (settled) return
      settled = true
      resolve(rows)
    }
    try {
      if (!db.objectStoreNames.contains(storeName)) return finish([])
      const tx = db.transaction(storeName, 'readonly')
      const request = tx.objectStore(storeName).getAll()
      request.onsuccess = () => finish(Array.isArray(request.result) ? request.result : [])
      request.onerror = () => finish([])
      tx.onerror = () => finish([])
      tx.onabort = () => finish([])
      setTimeout(() => finish([]), READ_TIMEOUT_MS)
    } catch {
      finish([])
    }
  })
}

export async function migrateLegacyDatabase(): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return
  } catch {
    return
  }

  const db = await openLegacyDatabase()
  if (!db) {
    markDone()
    return
  }

  try {
    const [workouts, templates, foods, foodLogs, waterLogs, weightEntries, muscleRecovery, exercises] =
      await Promise.all(STORE_NAMES.map((name) => readStore(db, name)))

    const legacy: LegacyImport = {
      workouts,
      templates,
      foods,
      foodLogs,
      waterLogs,
      weightEntries,
      muscleRecovery,
      exercises,
    }
    useDataStore.getState().mergeLegacy(legacy)
  } catch {
    /* best-effort: any failure just means starting fresh */
  } finally {
    try {
      db.close()
    } catch {
      /* ignore */
    }
    markDone()
  }
}

function markDone(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString())
  } catch {
    /* ignore */
  }
}
