import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import { isTransientIdbError } from '@/services/idbResilience'
import { attemptTransientRecovery, recoverFromChunkError } from '@/utils/repair'
import '@/styles/index.css'

// A lazy route chunk failed to load — typically a client that was serving a
// stale shell after a redeploy (or lost cache entries to iOS storage
// eviction). Self-heal instead of stranding the user on a black screen.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  recoverFromChunkError()
})

// WebKit occasionally drops the IndexedDB connection (backgrounded PWA,
// memory pressure); operations outside React's render path then surface as
// unhandled rejections. One guarded reload reopens the database cleanly.
window.addEventListener('unhandledrejection', (event) => {
  if (isTransientIdbError(event.reason)) {
    event.preventDefault()
    attemptTransientRecovery()
  }
})

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
