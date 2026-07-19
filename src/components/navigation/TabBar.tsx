import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ComponentType, SVGProps } from 'react'
import {
  BoltIcon as BoltOutline,
  ChartBarIcon as ChartBarOutline,
  EllipsisHorizontalCircleIcon as MoreOutline,
  FireIcon as FireOutline,
  HeartIcon as HeartOutline,
  HomeIcon as HomeOutline,
} from '@heroicons/react/24/outline'
import {
  BoltIcon as BoltSolid,
  ChartBarIcon as ChartBarSolid,
  EllipsisHorizontalCircleIcon as MoreSolid,
  FireIcon as FireSolid,
  HeartIcon as HeartSolid,
  HomeIcon as HomeSolid,
} from '@heroicons/react/24/solid'
import { cn } from '@/utils/cn'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

interface Tab {
  to: string
  label: string
  outline: IconComponent
  solid: IconComponent
}

const TABS: Tab[] = [
  { to: '/', label: 'Home', outline: HomeOutline, solid: HomeSolid },
  { to: '/workout', label: 'Workout', outline: BoltOutline, solid: BoltSolid },
  { to: '/recovery', label: 'Recovery', outline: HeartOutline, solid: HeartSolid },
  { to: '/nutrition', label: 'Nutrition', outline: FireOutline, solid: FireSolid },
  { to: '/progress', label: 'Progress', outline: ChartBarOutline, solid: ChartBarSolid },
  { to: '/more', label: 'More', outline: MoreOutline, solid: MoreSolid },
]

export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-bg/80 pb-safe backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active =
            tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to)
          const Icon = active ? tab.solid : tab.outline
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1 pt-2.5 pb-2"
            >
              {active ? (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              ) : null}
              <Icon
                className={cn('size-6', active ? 'text-accent' : 'text-content-tertiary')}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  active ? 'text-accent' : 'text-content-tertiary',
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
