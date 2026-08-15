import { useNavigate } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'
import {
  BeakerIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { cn } from '@/utils/cn'

interface ModuleRow {
  label: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  to?: string
}

const MODULES: ModuleRow[] = [
  {
    label: 'Settings',
    description: 'Profile, units, targets, data',
    icon: Cog6ToothIcon,
    to: '/more/settings',
  },
  {
    label: 'Meal Prep',
    description: 'Recipes, macros, shopping list',
    icon: ShoppingBagIcon,
    to: '/more/meal-prep',
  },
  { label: 'AI Coach', description: 'Personalized guidance across your data', icon: SparklesIcon },
  { label: 'Peptides', description: 'Dosing, schedules, inventory', icon: BeakerIcon },
  {
    label: 'Analytics',
    description: 'Strength trends, volume, plateau watch',
    icon: ChartPieIcon,
    to: '/more/analytics',
  },
  {
    label: 'Calendar',
    description: 'Everything on one timeline',
    icon: CalendarDaysIcon,
    to: '/more/calendar',
  },
]

export default function MorePage() {
  const navigate = useNavigate()

  return (
    <Screen title="More">
      <Card className="p-0">
        <ul className="divide-y divide-divider">
          {MODULES.map((module) => {
            const enabled = Boolean(module.to)
            const Icon = module.icon
            return (
              <li key={module.label}>
                <button
                  type="button"
                  disabled={!enabled}
                  onClick={() => module.to && navigate(module.to)}
                  className={cn(
                    'flex w-full items-center gap-3.5 px-4 py-3.5 text-left',
                    !enabled && 'opacity-50',
                  )}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-raised">
                    <Icon className="size-5 text-content-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">{module.label}</p>
                    <p className="truncate text-[12px] text-content-secondary">
                      {module.description}
                    </p>
                  </div>
                  {enabled ? (
                    <ChevronRightIcon className="size-4 shrink-0 text-content-tertiary" />
                  ) : (
                    <span className="shrink-0 rounded-full bg-surface-raised px-2.5 py-1 text-[10px] font-semibold tracking-wide text-content-tertiary uppercase">
                      Soon
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
      <p className="mt-4 px-2 text-center text-[12px] text-content-tertiary">
        Modules marked “Soon” are on the roadmap and will unlock in upcoming builds.
      </p>
    </Screen>
  )
}
