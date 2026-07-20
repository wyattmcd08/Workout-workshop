import { Component, type ReactNode } from 'react'
import { isTransientIdbError } from '@/services/idbResilience'
import {
  attemptTransientRecovery,
  repairAndReload,
  resetDatabaseAndReload,
} from '@/utils/repair'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  error: Error | null
  confirmingReset: boolean
}

/**
 * Catch-all so a runtime failure can never strand the user on a silent
 * black screen. Transient WebKit IndexedDB failures self-heal with one
 * guarded reload; everything else gets explicit recovery actions,
 * escalating to a database reset for persistent store corruption.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null, confirmingReset: false }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error) {
    if (isTransientIdbError(error)) attemptTransientRecovery()
  }

  render() {
    if (!this.state.error) return this.props.children
    const databaseError = isTransientIdbError(this.state.error)

    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center"
        style={{ backgroundColor: '#09090b', color: '#f4f4f5' }}
      >
        <div>
          <p className="text-[22px] font-bold">Something went wrong</p>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#9d9da6' }}>
            {databaseError
              ? 'The on-device database is not responding. This is an iOS storage issue, not a problem with the app itself.'
              : 'An unexpected error stopped Dialed Dawg.'}
          </p>
          <p className="mt-2 text-[11px] break-all" style={{ color: '#63636b' }}>
            {this.state.error.name}: {this.state.error.message}
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-2.5">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-12 rounded-2xl font-semibold"
            style={{ backgroundColor: '#30d158', color: '#000' }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => void repairAndReload()}
            className="h-12 rounded-2xl font-semibold"
            style={{ backgroundColor: '#1d1d22', color: '#f4f4f5' }}
          >
            Repair App
          </button>
          <p className="text-[11px]" style={{ color: '#63636b' }}>
            Repair clears cached app files and fetches the latest version. Your logged data is
            kept.
          </p>

          {databaseError ? (
            this.state.confirmingReset ? (
              <div
                className="flex flex-col gap-2 rounded-2xl p-3"
                style={{ backgroundColor: '#1d1d22' }}
              >
                <p className="text-[12px] leading-relaxed" style={{ color: '#9d9da6' }}>
                  This deletes the app's database on this device — logged workouts, meals, and
                  weigh-ins here are erased, then the app starts fresh. Use it only if Reload and
                  Repair keep failing.
                </p>
                <button
                  type="button"
                  onClick={() => void resetDatabaseAndReload()}
                  className="h-11 rounded-xl font-semibold"
                  style={{ backgroundColor: 'rgba(255,69,58,0.15)', color: '#ff453a' }}
                >
                  Erase Database &amp; Start Fresh
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ confirmingReset: false })}
                  className="h-11 rounded-xl font-semibold"
                  style={{ backgroundColor: 'transparent', color: '#9d9da6' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => this.setState({ confirmingReset: true })}
                className="h-12 rounded-2xl font-semibold"
                style={{ backgroundColor: 'rgba(255,69,58,0.15)', color: '#ff453a' }}
              >
                Reset Database…
              </button>
            )
          ) : null}
        </div>

        <p className="text-[11px]" style={{ color: '#63636b' }}>
          Build {__BUILD_STAMP__}
        </p>
      </div>
    )
  }
}
