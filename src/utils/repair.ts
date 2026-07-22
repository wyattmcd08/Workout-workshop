/**
 * Last-resort recovery: unregister every service worker, delete every cache,
 * and reload from the network. Heals clients stuck on a stale or partially
 * evicted precache (e.g. iOS storage eviction leaving a shell whose chunks
 * no longer exist anywhere). User data is untouched — localStorage, where all
 * app data now lives, is never cleared.
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

const RECOVERY_KEY = 'dialed-dawg-chunk-recovery-at'

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
