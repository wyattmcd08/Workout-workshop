import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { exportAllData, importAllData } from '@/services/dataTransfer'
import { useSettingsStore } from '@/store/settingsStore'
import type { UnitSystem } from '@/types'
import { cn } from '@/utils/cn'

const UNIT_OPTIONS: Array<{ value: UnitSystem; label: string }> = [
  { value: 'imperial', label: 'Pounds (lb)' },
  { value: 'metric', label: 'Kilograms (kg)' },
]

export default function SettingsPage() {
  const profile = useSettingsStore((s) => s.profile)
  const setName = useSettingsStore((s) => s.setName)
  const setUnitSystem = useSettingsStore((s) => s.setUnitSystem)
  const setTargets = useSettingsStore((s) => s.setTargets)
  const setWeeklyWorkoutGoal = useSettingsStore((s) => s.setWeeklyWorkoutGoal)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [transferMessage, setTransferMessage] = useState<string | null>(null)

  const updateTarget = (key: keyof typeof profile.targets, raw: string) => {
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) return
    setTargets({ ...profile.targets, [key]: value })
  }

  const handleImport = async (file: File) => {
    try {
      await importAllData(file)
      setTransferMessage('Data imported successfully.')
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : 'Import failed.')
    }
  }

  return (
    <Screen title="Settings" subtitle="More">
      <div className="flex flex-col gap-6">
        <section>
          <SectionHeader title="Profile" />
          <Card className="flex flex-col gap-4">
            <Field
              label="Your name"
              placeholder="What should we call you?"
              defaultValue={profile.name}
              onBlur={(e) => setName(e.target.value.trim())}
            />
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-content-secondary">Units</p>
              <div className="flex gap-1.5">
                {UNIT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUnitSystem(option.value)}
                    className={cn(
                      'h-11 flex-1 rounded-control text-[14px] font-semibold transition-colors',
                      profile.unitSystem === option.value
                        ? 'bg-accent text-black'
                        : 'bg-surface-sunken text-content-secondary',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section>
          <SectionHeader title="Daily Targets" />
          <Card className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Calories"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={profile.targets.calories}
                onBlur={(e) => updateTarget('calories', e.target.value)}
              />
              <Field
                label="Water"
                type="number"
                inputMode="numeric"
                suffix="ml"
                min={0}
                defaultValue={profile.targets.waterMl}
                onBlur={(e) => updateTarget('waterMl', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field
                label="Protein"
                type="number"
                inputMode="numeric"
                suffix="g"
                min={0}
                defaultValue={profile.targets.proteinG}
                onBlur={(e) => updateTarget('proteinG', e.target.value)}
              />
              <Field
                label="Carbs"
                type="number"
                inputMode="numeric"
                suffix="g"
                min={0}
                defaultValue={profile.targets.carbsG}
                onBlur={(e) => updateTarget('carbsG', e.target.value)}
              />
              <Field
                label="Fat"
                type="number"
                inputMode="numeric"
                suffix="g"
                min={0}
                defaultValue={profile.targets.fatG}
                onBlur={(e) => updateTarget('fatG', e.target.value)}
              />
            </div>
            <Field
              label="Workouts per week"
              type="number"
              inputMode="numeric"
              min={1}
              max={14}
              defaultValue={profile.weeklyWorkoutGoal}
              onBlur={(e) => {
                const value = Number(e.target.value)
                if (Number.isInteger(value) && value >= 1 && value <= 14) {
                  setWeeklyWorkoutGoal(value)
                }
              }}
            />
          </Card>
        </section>

        <section>
          <SectionHeader title="Data" />
          <Card className="flex flex-col gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => void exportAllData()}>
              Export All Data
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
            >
              Import From Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImport(file)
                e.target.value = ''
              }}
            />
            {transferMessage ? (
              <p className="text-center text-[12px] text-content-secondary">{transferMessage}</p>
            ) : null}
            <p className="text-center text-[11px] leading-relaxed text-content-tertiary">
              Everything is stored on this device. Export regularly to keep a backup — cloud sync
              is on the roadmap.
            </p>
          </Card>
        </section>
      </div>
    </Screen>
  )
}
