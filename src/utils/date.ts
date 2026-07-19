/** Local calendar day as YYYY-MM-DD. All day-scoped data keys use this. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function dateKeyDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return toDateKey(d)
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatWeekday(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatRelativeDay(timestamp: number): string {
  const key = toDateKey(new Date(timestamp))
  if (key === todayKey()) return 'Today'
  if (key === dateKeyDaysAgo(1)) return 'Yesterday'
  return formatShortDate(timestamp)
}

/** Hours elapsed between two timestamps. */
export function hoursBetween(earlier: number, later: number): number {
  return Math.max(0, later - earlier) / 3_600_000
}
