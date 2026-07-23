import { snapshotData, useDataStore, type DataSnapshot } from '@/store/dataStore'

interface ExportBundle {
  app: 'dialed-dawg'
  schemaVersion: 2
  exportedAt: string
  data: DataSnapshot
}

/** Serializes the entire dataset to a downloadable JSON file. */
export async function exportAllData(): Promise<void> {
  const bundle: ExportBundle = {
    app: 'dialed-dawg',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    data: snapshotData(),
  }

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `dialed-dawg-export-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

const ARRAY_KEYS = [
  'workouts',
  'templates',
  'foods',
  'foodLogs',
  'waterLogs',
  'weightEntries',
  'customExercises',
  'recipes',
  'shoppingList',
] as const

/** Restores a previously exported bundle, replacing current data. */
export async function importAllData(file: File): Promise<void> {
  const parsed: unknown = JSON.parse(await file.text())
  const bundle = parsed as Partial<ExportBundle>
  if (bundle?.app !== 'dialed-dawg' || typeof bundle.data !== 'object' || bundle.data === null) {
    throw new Error('This file is not a Dialed Dawg export.')
  }

  const source = bundle.data as unknown as Record<string, unknown>
  const snapshot: Partial<DataSnapshot> = {}
  for (const key of ARRAY_KEYS) {
    if (Array.isArray(source[key])) {
      snapshot[key] = source[key] as never
    }
  }
  // v1 exports were flat arrays of exercises; only custom ones matter now.
  if (!snapshot.customExercises && Array.isArray(source.exercises)) {
    snapshot.customExercises = (source.exercises as { isCustom?: boolean }[]).filter(
      (e) => e?.isCustom === true,
    ) as never
  }
  if (
    typeof source.muscleRecovery === 'object' &&
    source.muscleRecovery !== null &&
    !Array.isArray(source.muscleRecovery)
  ) {
    snapshot.muscleRecovery = source.muscleRecovery as DataSnapshot['muscleRecovery']
  } else if (Array.isArray(source.muscleRecovery)) {
    // v1 stored recovery as an array of records.
    const map: DataSnapshot['muscleRecovery'] = {}
    for (const raw of source.muscleRecovery) {
      const record = raw as { muscle?: keyof DataSnapshot['muscleRecovery'] }
      if (record?.muscle) map[record.muscle] = raw as never
    }
    snapshot.muscleRecovery = map
  }

  useDataStore.getState().replaceAll(snapshot)
}
