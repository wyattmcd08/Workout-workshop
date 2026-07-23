import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import type { WorkoutExercise } from '@/types'

interface ExerciseNoteSheetProps {
  exercise: WorkoutExercise | null
  onClose: () => void
  onSave: (notes: string) => void
}

export function ExerciseNoteSheet({ exercise, onClose, onSave }: ExerciseNoteSheetProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (exercise) setValue(exercise.notes)
  }, [exercise])

  const save = () => {
    onSave(value.trim())
    onClose()
  }

  return (
    <Sheet open={exercise !== null} onClose={onClose} title="Exercise Note">
      <div className="flex flex-col gap-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Cue, tempo, how it felt…"
          className="w-full rounded-control bg-surface-sunken px-4 py-3 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
        />
        <Button size="lg" fullWidth onClick={save}>
          Save Note
        </Button>
      </div>
    </Sheet>
  )
}
