import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import { recoverFromChunkError } from '@/utils/repair'
import '@/styles/index.css'

// A lazy route chunk failed to load — typically a client that was serving a
// stale shell after a redeploy (or lost cache entries to iOS storage
// eviction). Self-heal instead of stranding the user on a black screen.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  recoverFromChunkError()
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
