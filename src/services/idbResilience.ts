/**
 * iOS Safari/WebKit drops its IndexedDB connection when the app is
 * backgrounded or under memory pressure; the next operation then fails with
 * a transient error ("UnknownError: Unable to open cursor", "Connection to
 * Indexed Database server lost", …). A fresh page load (or re-running the
 * query on a new connection) succeeds. These helpers classify that error
 * family so recovery code can react to it — retrying inside the original
 * transaction never works, because IndexedDB transactions auto-commit the
 * moment control returns to the event loop.
 */
const TRANSIENT_PATTERN =
  /unable to open cursor|connection to indexed database server lost|database connection is closing|unknownerror/i

export function isTransientIdbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (error.name === 'UnknownError' || error.name === 'InvalidStateError') return true
  if (TRANSIENT_PATTERN.test(error.message) || TRANSIENT_PATTERN.test(error.name)) return true
  // Dexie wraps the original DOMException as `inner` on DexieError.
  const inner = (error as { inner?: unknown }).inner
  return inner instanceof Error && inner !== error ? isTransientIdbError(inner) : false
}
