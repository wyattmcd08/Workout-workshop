/**
 * Last-resort recovery: unregister every service worker, delete every cache,
 * and reload from the network. Heals clients stuck on a stale or partially
 * evicted precache (e.g. iOS storage eviction leaving a shell whose chunks
 * no longer exist anywhere). User data is untouched — IndexedDB and
 * localStorage are not cleared.
 */
export async function repairAndReload(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {
    // Even if cleanup partially fails, a reload is still the best move.
  } finally {
    window.location.reload()
  }
}

/**
 * Deletes the IndexedDB database entirely and reloads. Last resort for a
 * corrupted store (persistent 'UnknownError: Unable to open cursor' on iOS
 * that survives reloads) — WebKit corruption is only fixed by recreating
 * the database. Erases logged data on this device; the caller must warn.
 */
export async function resetDatabaseAndReload(): Promise<void> {
  try {
    // Close our connection first so deleteDatabase isn't blocked.
    const { db } = await import('@/services/db')
    db.close()
  } catch {
    // If the db module itself is broken, deletion below still applies.
  }
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('dialed-dawg')
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
    // Never hang the recovery path on a stuck deletion.
    setTimeout(resolve, 4000)
  })
  window.location.reload()
}

const RECOVERY_KEY = 'dialed-dawg-chunk-recovery-at'
const TRANSIENT_RETRY_KEY = 'dialed-dawg-transient-retry-at'

/**
 * One guarded reload for transient IndexedDB failures (WebKit dropping the
 * database connection). A reload reopens the connection cleanly. Returns
 * false when a reload already happened in the last minute — the caller
 * should then surface a real error UI instead of looping.
 */
export function attemptTransientRecovery(): boolean {
  const last = Number(sessionStorage.getItem(TRANSIENT_RETRY_KEY) ?? 0)
  if (Date.now() - last < 60_000) return false
  sessionStorage.setItem(TRANSIENT_RETRY_KEY, String(Date.now()))
  window.location.reload()
  return true
}

/**
 * Handles a failed lazy-chunk load (fires as Vite's `vite:preloadError`).
 * First failure: plain reload — after a deploy the fresh HTML references
 * chunks that exist again. A second failure within a minute means the cache
 * itself is poisoned, so do a full repair instead of looping.
 */
export function recoverFromChunkError(): void {
  const previous = Number(sessionStorage.getItem(RECOVERY_KEY) ?? 0)
  if (Date.now() - previous < 60_000) {
    void repairAndReload()
    return
  }
  sessionStorage.setItem(RECOVERY_KEY, String(Date.now()))
  window.location.reload()
}
