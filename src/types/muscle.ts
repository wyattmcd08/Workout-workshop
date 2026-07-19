/** Individual muscle groups tracked by the recovery system. */
export type MuscleGroup =
  | 'chest'
  | 'front-delts'
  | 'side-delts'
  | 'rear-delts'
  | 'traps'
  | 'lats'
  | 'upper-back'
  | 'lower-back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'calves'

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  'chest',
  'front-delts',
  'side-delts',
  'rear-delts',
  'traps',
  'lats',
  'upper-back',
  'lower-back',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'calves',
]

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  'front-delts': 'Front Delts',
  'side-delts': 'Side Delts',
  'rear-delts': 'Rear Delts',
  traps: 'Traps',
  lats: 'Lats',
  'upper-back': 'Upper Back',
  'lower-back': 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  adductors: 'Adductors',
  calves: 'Calves',
}

export type MuscleRegion = 'upper' | 'core' | 'lower'

export const MUSCLE_REGIONS: Record<MuscleGroup, MuscleRegion> = {
  chest: 'upper',
  'front-delts': 'upper',
  'side-delts': 'upper',
  'rear-delts': 'upper',
  traps: 'upper',
  lats: 'upper',
  'upper-back': 'upper',
  'lower-back': 'core',
  biceps: 'upper',
  triceps: 'upper',
  forearms: 'upper',
  abs: 'core',
  obliques: 'core',
  glutes: 'lower',
  quads: 'lower',
  hamstrings: 'lower',
  adductors: 'lower',
  calves: 'lower',
}
