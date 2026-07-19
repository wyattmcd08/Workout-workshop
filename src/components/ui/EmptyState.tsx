import type { ComponentType, ReactNode, SVGProps } from 'react'

interface EmptyStateProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  message: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent-muted">
        <Icon className="size-7 text-accent" />
      </div>
      <div>
        <p className="text-[16px] font-semibold">{title}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-content-secondary">{message}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
