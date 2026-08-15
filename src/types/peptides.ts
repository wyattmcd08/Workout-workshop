/** How often a peptide is scheduled. */
export type PeptideFrequency = 'daily' | 'weekly'

/** Time-of-day slot the dose is taken. */
export type PeptideTiming = 'am' | 'pm' | 'anytime'

export const PEPTIDE_TIMING_LABELS: Record<PeptideTiming, string> = {
  am: 'Morning',
  pm: 'Evening',
  anytime: 'Anytime',
}

/** Weekday labels, index 0 = Sunday to match Date.getDay(). */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export interface Peptide {
  id: string
  name: string
  /** Dose per administration, in micrograms. */
  doseMcg: number
  frequency: PeptideFrequency
  /** For 'weekly': weekdays it's taken (0=Sun..6=Sat). Empty for 'daily'. */
  daysOfWeek: number[]
  timing: PeptideTiming
  /** Remaining stock on hand, in micrograms. Doses subtract; restock adds. */
  inventoryMcg: number
  notes: string
  active: boolean
  createdAt: number
}

/** A single administered dose, kept for schedule state and history. */
export interface PeptideDoseLog {
  id: string
  peptideId: string
  dateKey: string
  doseMcg: number
  loggedAt: number
}
