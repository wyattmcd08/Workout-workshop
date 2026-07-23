import type { ComponentType, SVGProps } from 'react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  LinkIcon,
  LinkSlashIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Sheet } from '@/components/ui/Sheet'
import type { WorkoutExercise } from '@/types'
import { cn } from '@/utils/cn'

interface ExerciseActionSheetProps {
  exercise: WorkoutExercise | null
  isFirst: boolean
  isLast: boolean
  inSuperset: boolean
  onClose: () => void
  onAddNote: () => void
  onReplace: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleSuperset: () => void
  onRemove: () => void
}

interface Row {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
  hidden?: boolean
  destructive?: boolean
}

export function ExerciseActionSheet({
  exercise,
  isFirst,
  isLast,
  inSuperset,
  onClose,
  onAddNote,
  onReplace,
  onMoveUp,
  onMoveDown,
  onToggleSuperset,
  onRemove,
}: ExerciseActionSheetProps) {
  const hasNote = Boolean(exercise?.notes.trim())

  const rows: Row[] = [
    { icon: PencilSquareIcon, label: hasNote ? 'Edit note' : 'Add note', onClick: onAddNote },
    { icon: ArrowsRightLeftIcon, label: 'Replace exercise', onClick: onReplace },
    { icon: ArrowUpIcon, label: 'Move up', onClick: onMoveUp, hidden: isFirst },
    { icon: ArrowDownIcon, label: 'Move down', onClick: onMoveDown, hidden: isLast },
    {
      icon: inSuperset ? LinkSlashIcon : LinkIcon,
      label: inSuperset ? 'Remove from superset' : 'Superset with next',
      onClick: onToggleSuperset,
      // Can only start a superset when there is an exercise below.
      hidden: !inSuperset && isLast,
    },
    { icon: TrashIcon, label: 'Remove exercise', onClick: onRemove, destructive: true },
  ]

  return (
    <Sheet open={exercise !== null} onClose={onClose} title={exercise?.exerciseName ?? ''}>
      <ul className="flex flex-col">
        {rows
          .filter((row) => !row.hidden)
          .map((row) => {
            const Icon = row.icon
            return (
              <li key={row.label}>
                <button
                  type="button"
                  onClick={row.onClick}
                  className={cn(
                    'flex w-full items-center gap-3.5 py-3.5 text-left',
                    row.destructive ? 'text-red' : 'text-content',
                  )}
                >
                  <Icon className="size-5.5" />
                  <span className="text-[16px] font-medium">{row.label}</span>
                </button>
              </li>
            )
          })}
      </ul>
    </Sheet>
  )
}
