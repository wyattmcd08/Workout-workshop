import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ForwardIcon, PlusIcon } from '@heroicons/react/24/solid'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'

/**
 * Floating rest countdown pinned above the tab bar while resting between
 * sets. Driven by an absolute end timestamp so it stays correct across
 * re-renders, navigation, and reloads.
 */
export function RestTimerBar() {
  const restTimer = useWorkoutSessionStore((s) => s.restTimer)
  const extendRest = useWorkoutSessionStore((s) => s.extendRest)
  const clearRest = useWorkoutSessionStore((s) => s.clearRest)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!restTimer) return
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [restTimer])

  useEffect(() => {
    if (restTimer && restTimer.endsAt <= now) clearRest()
  }, [restTimer, now, clearRest])

  const remainingMs = restTimer ? Math.max(0, restTimer.endsAt - now) : 0
  const remaining = Math.ceil(remainingMs / 1000)
  const fraction = restTimer ? remainingMs / (restTimer.totalSeconds * 1000) : 0
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <AnimatePresence>
      {restTimer ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg"
        >
          <div className="overflow-hidden rounded-2xl border border-divider bg-surface-raised/95 shadow-card backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-content-secondary uppercase">
                  Rest
                </p>
                <p className="text-[22px] leading-tight font-bold tabular-nums">
                  {minutes}:{String(seconds).padStart(2, '0')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => extendRest(30)}
                  className="flex h-10 items-center gap-1 rounded-xl bg-surface-sunken px-3.5 text-[13px] font-semibold"
                >
                  <PlusIcon className="size-3.5" />
                  30s
                </button>
                <button
                  type="button"
                  onClick={clearRest}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-[13px] font-semibold text-black"
                >
                  <ForwardIcon className="size-4" />
                  Skip
                </button>
              </div>
            </div>
            <div className="h-1 bg-white/8">
              <div
                className="h-full bg-accent"
                style={{ width: `${fraction * 100}%`, transition: 'width 0.25s linear' }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
