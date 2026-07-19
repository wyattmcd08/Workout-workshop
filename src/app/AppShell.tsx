import { Outlet, useLocation } from 'react-router-dom'
import { TabBar } from '@/components/navigation/TabBar'

/** Root layout: routed content above a persistent bottom tab bar. */
export function AppShell() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh bg-bg">
      {/* Remount page on route change so each screen plays its entrance. */}
      <main key={pathname}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
