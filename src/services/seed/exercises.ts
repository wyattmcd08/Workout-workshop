import type { Equipment, Exercise, MovementPattern, MuscleGroup } from '@/types'

interface SeedExercise {
  id: string
  name: string
  equipment: Equipment
  pattern: MovementPattern
  primary: MuscleGroup[]
  secondary: MuscleGroup[]
}

/**
 * Built-in exercise database. IDs are stable slugs so user data referencing
 * them survives app updates and future seed additions.
 */
const SEED: SeedExercise[] = [
  // ---- Chest / horizontal push ----
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', equipment: 'barbell', pattern: 'horizontal-push', primary: ['chest'], secondary: ['front-delts', 'triceps'] },
  { id: 'incline-barbell-bench-press', name: 'Incline Barbell Bench Press', equipment: 'barbell', pattern: 'horizontal-push', primary: ['chest', 'front-delts'], secondary: ['triceps'] },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', equipment: 'dumbbell', pattern: 'horizontal-push', primary: ['chest'], secondary: ['front-delts', 'triceps'] },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', equipment: 'dumbbell', pattern: 'horizontal-push', primary: ['chest', 'front-delts'], secondary: ['triceps'] },
  { id: 'machine-chest-press', name: 'Machine Chest Press', equipment: 'machine', pattern: 'horizontal-push', primary: ['chest'], secondary: ['front-delts', 'triceps'] },
  { id: 'cable-fly', name: 'Cable Fly', equipment: 'cable', pattern: 'isolation', primary: ['chest'], secondary: ['front-delts'] },
  { id: 'pec-deck-fly', name: 'Pec Deck Fly', equipment: 'machine', pattern: 'isolation', primary: ['chest'], secondary: [] },
  { id: 'push-up', name: 'Push-Up', equipment: 'bodyweight', pattern: 'horizontal-push', primary: ['chest'], secondary: ['front-delts', 'triceps', 'abs'] },
  { id: 'dip', name: 'Dip', equipment: 'bodyweight', pattern: 'vertical-push', primary: ['chest', 'triceps'], secondary: ['front-delts'] },

  // ---- Shoulders / vertical push ----
  { id: 'overhead-press', name: 'Overhead Press', equipment: 'barbell', pattern: 'vertical-push', primary: ['front-delts'], secondary: ['side-delts', 'triceps', 'abs'] },
  { id: 'seated-dumbbell-shoulder-press', name: 'Seated Dumbbell Shoulder Press', equipment: 'dumbbell', pattern: 'vertical-push', primary: ['front-delts', 'side-delts'], secondary: ['triceps'] },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', equipment: 'machine', pattern: 'vertical-push', primary: ['front-delts', 'side-delts'], secondary: ['triceps'] },
  { id: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', equipment: 'dumbbell', pattern: 'isolation', primary: ['side-delts'], secondary: [] },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', equipment: 'cable', pattern: 'isolation', primary: ['side-delts'], secondary: [] },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', equipment: 'machine', pattern: 'isolation', primary: ['rear-delts'], secondary: ['upper-back'] },
  { id: 'face-pull', name: 'Face Pull', equipment: 'cable', pattern: 'isolation', primary: ['rear-delts'], secondary: ['upper-back', 'traps'] },

  // ---- Back / pulls ----
  { id: 'pull-up', name: 'Pull-Up', equipment: 'bodyweight', pattern: 'vertical-pull', primary: ['lats'], secondary: ['biceps', 'upper-back', 'rear-delts'] },
  { id: 'chin-up', name: 'Chin-Up', equipment: 'bodyweight', pattern: 'vertical-pull', primary: ['lats', 'biceps'], secondary: ['upper-back'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', equipment: 'cable', pattern: 'vertical-pull', primary: ['lats'], secondary: ['biceps', 'upper-back'] },
  { id: 'barbell-row', name: 'Barbell Row', equipment: 'barbell', pattern: 'horizontal-pull', primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts', 'lower-back'] },
  { id: 'dumbbell-row', name: 'Dumbbell Row', equipment: 'dumbbell', pattern: 'horizontal-pull', primary: ['lats', 'upper-back'], secondary: ['biceps', 'rear-delts'] },
  { id: 'seated-cable-row', name: 'Seated Cable Row', equipment: 'cable', pattern: 'horizontal-pull', primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
  { id: 'chest-supported-row', name: 'Chest-Supported Row', equipment: 'machine', pattern: 'horizontal-pull', primary: ['upper-back'], secondary: ['lats', 'biceps', 'rear-delts'] },
  { id: 'barbell-shrug', name: 'Barbell Shrug', equipment: 'barbell', pattern: 'isolation', primary: ['traps'], secondary: ['forearms'] },

  // ---- Hinge / posterior chain ----
  { id: 'deadlift', name: 'Deadlift', equipment: 'barbell', pattern: 'hinge', primary: ['glutes', 'hamstrings', 'lower-back'], secondary: ['quads', 'traps', 'forearms', 'lats'] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', equipment: 'barbell', pattern: 'hinge', primary: ['hamstrings', 'glutes'], secondary: ['lower-back', 'forearms'] },
  { id: 'dumbbell-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', equipment: 'dumbbell', pattern: 'hinge', primary: ['hamstrings', 'glutes'], secondary: ['lower-back'] },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', equipment: 'barbell', pattern: 'hinge', primary: ['glutes'], secondary: ['hamstrings', 'quads'] },
  { id: 'back-extension', name: 'Back Extension', equipment: 'bodyweight', pattern: 'hinge', primary: ['lower-back', 'glutes'], secondary: ['hamstrings'] },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', equipment: 'kettlebell', pattern: 'hinge', primary: ['glutes', 'hamstrings'], secondary: ['lower-back', 'abs'] },

  // ---- Squat / lunge ----
  { id: 'barbell-back-squat', name: 'Barbell Back Squat', equipment: 'barbell', pattern: 'squat', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lower-back', 'abs', 'adductors'] },
  { id: 'front-squat', name: 'Front Squat', equipment: 'barbell', pattern: 'squat', primary: ['quads'], secondary: ['glutes', 'abs', 'upper-back'] },
  { id: 'goblet-squat', name: 'Goblet Squat', equipment: 'dumbbell', pattern: 'squat', primary: ['quads', 'glutes'], secondary: ['abs', 'adductors'] },
  { id: 'leg-press', name: 'Leg Press', equipment: 'machine', pattern: 'squat', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'] },
  { id: 'hack-squat', name: 'Hack Squat', equipment: 'machine', pattern: 'squat', primary: ['quads'], secondary: ['glutes', 'adductors'] },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', equipment: 'dumbbell', pattern: 'lunge', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'] },
  { id: 'walking-lunge', name: 'Walking Lunge', equipment: 'dumbbell', pattern: 'lunge', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'] },
  { id: 'leg-extension', name: 'Leg Extension', equipment: 'machine', pattern: 'isolation', primary: ['quads'], secondary: [] },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', equipment: 'machine', pattern: 'isolation', primary: ['hamstrings'], secondary: [] },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', equipment: 'machine', pattern: 'isolation', primary: ['hamstrings'], secondary: [] },
  { id: 'hip-adduction-machine', name: 'Hip Adduction Machine', equipment: 'machine', pattern: 'isolation', primary: ['adductors'], secondary: [] },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', equipment: 'machine', pattern: 'isolation', primary: ['calves'], secondary: [] },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', equipment: 'machine', pattern: 'isolation', primary: ['calves'], secondary: [] },

  // ---- Arms ----
  { id: 'barbell-curl', name: 'Barbell Curl', equipment: 'barbell', pattern: 'isolation', primary: ['biceps'], secondary: ['forearms'] },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', equipment: 'dumbbell', pattern: 'isolation', primary: ['biceps'], secondary: ['forearms'] },
  { id: 'hammer-curl', name: 'Hammer Curl', equipment: 'dumbbell', pattern: 'isolation', primary: ['biceps', 'forearms'], secondary: [] },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', equipment: 'dumbbell', pattern: 'isolation', primary: ['biceps'], secondary: [] },
  { id: 'cable-curl', name: 'Cable Curl', equipment: 'cable', pattern: 'isolation', primary: ['biceps'], secondary: ['forearms'] },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', equipment: 'cable', pattern: 'isolation', primary: ['triceps'], secondary: [] },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', equipment: 'cable', pattern: 'isolation', primary: ['triceps'], secondary: [] },
  { id: 'skull-crusher', name: 'Skull Crusher', equipment: 'barbell', pattern: 'isolation', primary: ['triceps'], secondary: [] },
  { id: 'wrist-curl', name: 'Wrist Curl', equipment: 'dumbbell', pattern: 'isolation', primary: ['forearms'], secondary: [] },

  // ---- Core ----
  { id: 'plank', name: 'Plank', equipment: 'bodyweight', pattern: 'core', primary: ['abs'], secondary: ['obliques'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', equipment: 'bodyweight', pattern: 'core', primary: ['abs'], secondary: ['obliques', 'forearms'] },
  { id: 'cable-crunch', name: 'Cable Crunch', equipment: 'cable', pattern: 'core', primary: ['abs'], secondary: [] },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', equipment: 'other', pattern: 'core', primary: ['abs'], secondary: ['obliques', 'lats'] },
  { id: 'russian-twist', name: 'Russian Twist', equipment: 'bodyweight', pattern: 'core', primary: ['obliques'], secondary: ['abs'] },
  { id: 'side-plank', name: 'Side Plank', equipment: 'bodyweight', pattern: 'core', primary: ['obliques'], secondary: ['abs'] },
  { id: 'farmers-carry', name: "Farmer's Carry", equipment: 'dumbbell', pattern: 'carry', primary: ['forearms', 'traps'], secondary: ['abs', 'obliques'] },
]

export const SEED_EXERCISES: Exercise[] = SEED.map((seed) => ({
  id: seed.id,
  name: seed.name,
  equipment: seed.equipment,
  pattern: seed.pattern,
  primaryMuscles: seed.primary,
  secondaryMuscles: seed.secondary,
  isCustom: false,
}))
