import { db } from './db'

interface ExportBundle {
  app: 'dialed-dawg'
  schemaVersion: 1
  exportedAt: string
  data: Record<string, unknown[]>
}

const EXPORTED_TABLES = [
  'exercises',
  'workouts',
  'templates',
  'foods',
  'foodLogs',
  'waterLogs',
  'weightEntries',
  'muscleRecovery',
] as const

/** Serializes the entire database to a downloadable JSON file. */
export async function exportAllData(): Promise<void> {
  const data: Record<string, unknown[]> = {}
  for (const tableName of EXPORTED_TABLES) {
    data[tableName] = await db.table(tableName).toArray()
  }
  const bundle: ExportBundle = {
    app: 'dialed-dawg',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
  }

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `dialed-dawg-export-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Restores a previously exported bundle, replacing current data. */
export async function importAllData(file: File): Promise<void> {
  const parsed: unknown = JSON.parse(await file.text())
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as ExportBundle).app !== 'dialed-dawg' ||
    typeof (parsed as ExportBundle).data !== 'object'
  ) {
    throw new Error('This file is not a Dialed Dawg export.')
  }
  const bundle = parsed as ExportBundle

  await db.transaction('rw', db.tables, async () => {
    for (const tableName of EXPORTED_TABLES) {
      const rows = bundle.data[tableName]
      if (!Array.isArray(rows)) continue
      const table = db.table(tableName)
      await table.clear()
      await table.bulkAdd(rows)
    }
  })
}
