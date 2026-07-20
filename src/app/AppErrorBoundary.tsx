import { Component, type ReactNode } from 'react'
import { isTransientIdbError } from '@/services/idbResilience'
import { attemptTransientRecovery, repairAndReload } from '@/utils/repair'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  error: Error | null
}

/**
 * Catch-all so a runtime failure can never strand the user on a silent
 * black screen. Offers a plain reload and a full repair (clear service
 * worker + caches; user data in IndexedDB is preserved).
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Transient WebKit IndexedDB failures (connection dropped after
    // backgrounding) clear on a fresh load. Retry once per minute
    // automatically; only a repeat failure shows the recovery screen.
    if (isTransientIdbError(error)) attemptTransientRecovery()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center"
        style={{ backgroundColor: '#09090b', color: '#f4f4f5' }}
      >
        <div>
          <p className="text-[22px] font-bold">Something went wrong</p>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#9d9da6' }}>
            An unexpected error stopped Dialed Dawg. Your data is safe on this device.
          </p>
          <p className="mt-2 text-[11px] break-all" style={{ color: '#63636b' }}>
            {this.state.error.message}
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
            Repair clears cached app files and fetches the latest version. Workouts, nutrition,
            and settings are kept.
          </p>
        </div>
      </div>
    )
  }
}
