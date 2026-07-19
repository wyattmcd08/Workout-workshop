import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  action?: ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between px-1">
      <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  )
}
