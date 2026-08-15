import { useEffect, useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useDataStore } from '@/store/dataStore'
import type { Peptide, PeptideFrequency, PeptideTiming } from '@/types'
import { PEPTIDE_TIMING_LABELS, WEEKDAY_LABELS } from '@/types'
import { cn } from '@/utils/cn'
import { createId } from '@/utils/id'

const FREQUENCIES: Array<{ value: PeptideFrequency; label: string }> = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Specific days' },
]

const TIMINGS: PeptideTiming[] = ['am', 'pm', 'anytime']

interface PeptideEditorSheetProps {
  open: boolean
  onClose: () => void
  /** When set, edits this peptide instead of creating a new one. */
  peptide?: Peptide | null
}

export function PeptideEditorSheet({ open, onClose, peptide }: PeptideEditorSheetProps) {
  const addPeptide = useDataStore((s) => s.addPeptide)
  const updatePeptide = useDataStore((s) => s.updatePeptide)
  const deletePeptide = useDataStore((s) => s.deletePeptide)

  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<PeptideFrequency>('daily')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [timing, setTiming] = useState<PeptideTiming>('am')
  const [inventory, setInventory] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (peptide) {
      setName(peptide.name)
      setDose(String(peptide.doseMcg))
      setFrequency(peptide.frequency)
      setDays(peptide.daysOfWeek.length > 0 ? peptide.daysOfWeek : [1, 2, 3, 4, 5])
      setTiming(peptide.timing)
      setInventory(String(peptide.inventoryMcg))
      setNotes(peptide.notes)
      setActive(peptide.active)
    } else {
      setName('')
      setDose('')
      setFrequency('daily')
      setDays([1, 2, 3, 4, 5])
      setTiming('am')
      setInventory('')
      setNotes('')
      setActive(true)
    }
    setError(null)
  }, [open, peptide])

  const toggleDay = (day: number) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleSave = () => {
    const trimmed = name.trim()
    const doseMcg = Number(dose)
    if (!trimmed) return setError('Name the peptide')
    if (!Number.isFinite(doseMcg) || doseMcg <= 0) return setError('Enter a dose in mcg')
    if (frequency === 'weekly' && days.length === 0) return setError('Pick at least one day')

    const inventoryMcg = Math.max(0, Number(inventory) || 0)
    const daysOfWeek = frequency === 'weekly' ? [...days].sort((a, b) => a - b) : []

    if (peptide) {
      updatePeptide(peptide.id, {
        name: trimmed,
        doseMcg,
        frequency,
        daysOfWeek,
        timing,
        inventoryMcg,
        notes: notes.trim(),
        active,
      })
    } else {
      const newPeptide: Peptide = {
        id: createId(),
        name: trimmed,
        doseMcg,
        frequency,
        daysOfWeek,
        timing,
        inventoryMcg,
        notes: notes.trim(),
        active: true,
        createdAt: Date.now(),
      }
      addPeptide(newPeptide)
    }
    onClose()
  }

  const handleDelete = () => {
    if (peptide) deletePeptide(peptide.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={peptide ? 'Edit Peptide' : 'New Peptide'}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="peptide-name" className="text-[13px] font-medium text-content-secondary">
            Name
          </label>
          <input
            id="peptide-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="e.g. BPC-157"
            className="h-12 w-full rounded-control bg-surface-sunken px-4 text-[16px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Dose"
            type="number"
            inputMode="decimal"
            suffix="mcg"
            min={0}
            value={dose}
            onChange={(e) => {
              setDose(e.target.value)
              setError(null)
            }}
          />
          <Field
            label="On hand"
            type="number"
            inputMode="decimal"
            suffix="mcg"
            min={0}
            value={inventory}
            onChange={(e) => setInventory(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-content-secondary">Schedule</p>
          <div className="flex gap-1.5">
            {FREQUENCIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFrequency(option.value)}
                className={cn(
                  'h-10 flex-1 rounded-control text-[14px] font-semibold transition-colors',
                  frequency === option.value
                    ? 'bg-accent text-black'
                    : 'bg-surface-sunken text-content-secondary',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {frequency === 'weekly' ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    toggleDay(index)
                    setError(null)
                  }}
                  className={cn(
                    'h-9 min-w-11 flex-1 rounded-xl text-[13px] font-semibold transition-colors',
                    days.includes(index)
                      ? 'bg-accent text-black'
                      : 'bg-surface-sunken text-content-secondary',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-content-secondary">Time of day</p>
          <div className="flex gap-1.5">
            {TIMINGS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTiming(option)}
                className={cn(
                  'h-10 flex-1 rounded-control text-[14px] font-semibold transition-colors',
                  timing === option
                    ? 'bg-accent text-black'
                    : 'bg-surface-sunken text-content-secondary',
                )}
              >
                {PEPTIDE_TIMING_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="peptide-notes" className="text-[13px] font-medium text-content-secondary">
            Notes
          </label>
          <textarea
            id="peptide-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Reconstitution, cycle length, site…"
            className="w-full rounded-control bg-surface-sunken px-4 py-3 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
          />
        </div>

        {peptide ? (
          <button
            type="button"
            onClick={() => setActive((prev) => !prev)}
            className="flex items-center justify-between rounded-control bg-surface-sunken px-4 py-3"
          >
            <span className="text-[15px] font-medium">Active</span>
            <span
              className={cn(
                'relative h-7 w-12 rounded-full transition-colors',
                active ? 'bg-accent' : 'bg-white/15',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-6 rounded-full bg-white transition-all',
                  active ? 'left-[1.375rem]' : 'left-0.5',
                )}
              />
            </span>
          </button>
        ) : null}

        {error ? <p className="text-[13px] font-medium text-red">{error}</p> : null}

        <Button type="button" size="lg" fullWidth onClick={handleSave}>
          {peptide ? 'Save Changes' : 'Add Peptide'}
        </Button>

        {peptide ? (
          <Button type="button" variant="destructive" fullWidth onClick={handleDelete}>
            <TrashIcon className="size-5" />
            Delete Peptide
          </Button>
        ) : null}
      </div>
    </Sheet>
  )
}
