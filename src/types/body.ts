export interface WeightEntry {
  id: string
  dateKey: string
  /** Stored in kilograms; converted for display based on unit settings. */
  weightKg: number
  loggedAt: number
}
