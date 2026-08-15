import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BeakerIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Screen } from '@/components/ui/Screen'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PeptideEditorSheet } from '@/features/peptides/components/PeptideEditorSheet'
import {
  isLowStock,
  remainingDoses,
  usePeptideHistory,
  usePeptides,
  useTodaySchedule,
} from '@/features/peptides/hooks/usePeptides'
import { useDataStore } from '@/store/dataStore'
import type { Peptide } from '@/types'
import { PEPTIDE_TIMING_LABELS, WEEKDAY_LABELS } from '@/types'
import { todayKey } from '@/utils/date'
import { cn } from '@/utils/cn'

type Tab = 'today' | 'peptides' | 'history'

const TABS = [
  { value: 'today', label: 'Today' },
  { value: 'peptides', label: 'Peptides' },
  { value: 'history', label: 'History' },
] as const

function scheduleText(peptide: Peptide): string {
  if (peptide.frequency === 'daily') return 'Every day'
  if (peptide.daysOfWeek.length === 7) return 'Every day'
  if (peptide.daysOfWeek.length === 0) return 'No days set'
  return peptide.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(', ')
}

function TodayTab() {
  const { due, offToday, completed, total } = useTodaySchedule()
  const logPeptideDose = useDataStore((s) => s.logPeptideDose)
  const deletePeptideLog = useDataStore((s) => s.deletePeptideLog)

  if (total === 0 && offToday.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={BeakerIcon}
          title="Nothing scheduled"
          message="Add a peptide with a dose and schedule, and today's doses will show up here to check off."
        />
      </Card>
    )
  }

  const progress = total > 0 ? completed / total : 1

  return (
    <div className="flex flex-col gap-3">
      {total > 0 ? (
        <Card>
          <div className="flex items-center gap-5">
            <ProgressRing progress={progress} size={72} strokeWidth={7} color="var(--color-accent)">
              <span className="text-[15px] font-bold tabular-nums">
                {completed}/{total}
              </span>
            </ProgressRing>
            <div>
              <p className="text-[15px] font-semibold">
                {completed === total ? 'All doses logged' : "Today's doses"}
              </p>
              <p className="mt-0.5 text-[12px] text-content-secondary">
                {completed === total
                  ? 'Nice — you’re dialed in for today.'
                  : `${total - completed} left to take`}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {due.map((item) => {
        const empty = item.remaining <= 0 && !item.logged
        return (
          <Card key={item.peptide.id}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={item.logged ? `Undo ${item.peptide.name}` : `Log ${item.peptide.name}`}
                onClick={() =>
                  item.logged && item.logId
                    ? deletePeptideLog(item.logId)
                    : logPeptideDose(item.peptide.id, todayKey())
                }
                disabled={empty}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  item.logged
                    ? 'border-accent bg-accent text-black'
                    : 'border-content-tertiary text-transparent',
                  empty && 'opacity-40',
                )}
              >
                <CheckIcon className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-[15px] font-semibold',
                    item.logged && 'text-content-secondary line-through',
                  )}
                >
                  {item.peptide.name}
                </p>
                <p className="mt-0.5 text-[12px] text-content-secondary">
                  {item.peptide.doseMcg} mcg · {PEPTIDE_TIMING_LABELS[item.peptide.timing]}
                  {empty ? ' · out of stock' : ''}
                </p>
              </div>
              {!item.logged ? (
                <span className="shrink-0 text-[12px] font-semibold text-content-tertiary tabular-nums">
                  {item.remaining} left
                </span>
              ) : null}
            </div>
          </Card>
        )
      })}

      {offToday.length > 0 ? (
        <div>
          <p className="mt-2 mb-2 px-1 text-[12px] font-semibold tracking-wide text-content-tertiary uppercase">
            Not scheduled today
          </p>
          <Card className="p-0">
            <ul className="divide-y divide-divider">
              {offToday.map((peptide) => (
                <li key={peptide.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-[14px] text-content-secondary">{peptide.name}</p>
                  <p className="text-[12px] text-content-tertiary">{scheduleText(peptide)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function PeptidesTab() {
  const peptides = usePeptides()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Peptide | null>(null)

  const openNew = () => {
    setEditing(null)
    setEditorOpen(true)
  }
  const openEdit = (peptide: Peptide) => {
    setEditing(peptide)
    setEditorOpen(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" fullWidth onClick={openNew}>
        <PlusIcon className="size-5" />
        Add Peptide
      </Button>

      {peptides.length > 0 ? (
        peptides.map((peptide) => {
          const left = remainingDoses(peptide)
          const low = isLowStock(peptide)
          return (
            <Card key={peptide.id} onPress={() => openEdit(peptide)}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[15px] font-semibold">
                    <span className="truncate">{peptide.name}</span>
                    {!peptide.active ? (
                      <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold tracking-wide text-content-tertiary uppercase">
                        Paused
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[12px] text-content-secondary">
                    {peptide.doseMcg} mcg · {scheduleText(peptide)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      'text-[15px] font-bold tabular-nums',
                      left <= 0 ? 'text-red' : low ? 'text-orange' : 'text-content',
                    )}
                  >
                    {left}
                  </p>
                  <p className="text-[11px] text-content-tertiary">doses left</p>
                </div>
              </div>
              {low || left <= 0 ? (
                <p
                  className={cn(
                    'mt-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium',
                    left <= 0 ? 'bg-red/10 text-red' : 'bg-orange/10 text-orange',
                  )}
                >
                  {left <= 0
                    ? 'Out of stock — restock to keep logging doses.'
                    : 'Running low — time to reorder soon.'}
                </p>
              ) : null}
            </Card>
          )
        })
      ) : (
        <Card>
          <EmptyState
            icon={BeakerIcon}
            title="No peptides yet"
            message="Add your first peptide with its dose, schedule, and how much you have on hand. Doses you log will draw down your inventory."
            action={
              <Button size="sm" onClick={openNew}>
                Add a peptide
              </Button>
            }
          />
        </Card>
      )}

      <PeptideEditorSheet
        open={editorOpen}
        peptide={editing}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  )
}

function HistoryTab() {
  const days = usePeptideHistory()
  const deletePeptideLog = useDataStore((s) => s.deletePeptideLog)

  if (days.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ClockIcon}
          title="No doses logged"
          message="Once you start checking off doses on the Today tab, your history will build up here."
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <div key={day.dateKey}>
          <p className="mb-2 px-1 text-[12px] font-semibold tracking-wide text-content-tertiary uppercase">
            {day.label}
          </p>
          <Card className="p-0">
            <ul>
              <AnimatePresence initial={false}>
                {day.entries.map((entry, index) => (
                  <motion.li
                    key={entry.log.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3',
                      index > 0 && 'border-t border-divider',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{entry.peptideName}</p>
                      <p className="text-[12px] text-content-tertiary">
                        {entry.log.doseMcg} mcg ·{' '}
                        {new Date(entry.log.loggedAt).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${entry.peptideName} dose`}
                      onClick={() => deletePeptideLog(entry.log.id)}
                      className="shrink-0 text-content-tertiary"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Card>
        </div>
      ))}
    </div>
  )
}

export default function PeptidesPage() {
  const [tab, setTab] = useState<Tab>('today')

  return (
    <Screen title="Peptides" subtitle="More">
      <div className="mb-5">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} layoutId="peptides-tab" />
      </div>
      {tab === 'today' ? <TodayTab /> : tab === 'peptides' ? <PeptidesTab /> : <HistoryTab />}
    </Screen>
  )
}
