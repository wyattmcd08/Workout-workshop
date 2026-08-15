import { useRef, useState } from 'react'
import { CheckIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { exportAllData, importAllData } from '@/services/dataTransfer'
import { useSettingsStore } from '@/store/settingsStore'
import { repairAndReload } from '@/utils/repair'
import { ACCENT_COLORS, ACCENT_OPTIONS } from '@/utils/accent'
import type { HomeWidgets, UnitSystem } from '@/types'
import { cn } from '@/utils/cn'

const HOME_WIDGET_OPTIONS: Array<{ key: keyof HomeWidgets; label: string; description: string }> = [
  { key: 'stats', label: 'Stat row', description: 'Streak, readiness, weekly workouts' },
  { key: 'hydration', label: 'Hydration', description: 'Water tracker with quick-add' },
  { key: 'weightTrend', label: 'Weight trend', description: '30-day weight chart' },
]

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
  const setDefaultRestSeconds = useSettingsStore((s) => s.setDefaultRestSeconds)
  const setAccentColor = useSettingsStore((s) => s.setAccentColor)
  const setHomeWidget = useSettingsStore((s) => s.setHomeWidget)

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
          <SectionHeader title="Customization" />
          <Card className="flex flex-col gap-5">
            <div>
              <p className="mb-2.5 text-[13px] font-medium text-content-secondary">Accent color</p>
              <div className="flex flex-wrap gap-3">
                {ACCENT_OPTIONS.map((option) => {
                  const selected = profile.accentColor === option
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-label={ACCENT_COLORS[option].label}
                      aria-pressed={selected}
                      onClick={() => setAccentColor(option)}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full transition-transform active:scale-90',
                        selected && 'ring-2 ring-content ring-offset-2 ring-offset-surface',
                      )}
                      style={{ backgroundColor: ACCENT_COLORS[option].solid }}
                    >
                      {selected ? <CheckIcon className="size-5 text-black" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-[13px] font-medium text-content-secondary">
                Home screen widgets
              </p>
              <div className="flex flex-col gap-2.5">
                {HOME_WIDGET_OPTIONS.map((widget) => {
                  const on = profile.homeWidgets[widget.key]
                  return (
                    <button
                      key={widget.key}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={widget.label}
                      onClick={() => setHomeWidget(widget.key, !on)}
                      className="flex items-center justify-between gap-3 rounded-control bg-surface-sunken px-4 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium">{widget.label}</p>
                        <p className="truncate text-[12px] text-content-secondary">
                          {widget.description}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                          on ? 'bg-accent' : 'bg-white/15',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 size-6 rounded-full bg-white transition-all',
                            on ? 'left-[1.375rem]' : 'left-0.5',
                          )}
                        />
                      </span>
                    </button>
                  )
                })}
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
            <div className="grid grid-cols-2 gap-3">
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
              <Field
                label="Rest timer"
                type="number"
                inputMode="numeric"
                suffix="sec"
                min={15}
                max={600}
                step={15}
                defaultValue={profile.defaultRestSeconds}
                onBlur={(e) => {
                  const value = Number(e.target.value)
                  if (Number.isFinite(value) && value >= 15 && value <= 600) {
                    setDefaultRestSeconds(Math.round(value))
                  }
                }}
              />
            </div>
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

        <section>
          <SectionHeader title="App" />
          <Card className="flex flex-col gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => void repairAndReload()}>
              Repair &amp; Update App
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-content-tertiary">
              Clears cached app files and reloads the latest version from the server. Your
              workouts, nutrition, and settings are kept.
            </p>
            <p className="text-center text-[11px] text-content-tertiary">
              Build {__BUILD_STAMP__}
            </p>
          </Card>
        </section>
      </div>
    </Screen>
  )
}
