import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useUnitSystem } from '@/store/settingsStore'
import { fromDisplayWeight, weightUnitLabel } from '@/utils/units'
import { logWeight } from '../hooks/useWeightEntries'

const weightSchema = z.object({
  weight: z
    .number({ message: 'Enter your weight' })
    .positive('Enter your weight')
    .max(1500, 'That cannot be right'),
})

type WeightFormValues = z.infer<typeof weightSchema>

interface AddWeightSheetProps {
  open: boolean
  onClose: () => void
}

export function AddWeightSheet({ open, onClose }: AddWeightSheetProps) {
  const unitSystem = useUnitSystem()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WeightFormValues>({ resolver: zodResolver(weightSchema) })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async ({ weight }) => {
    await logWeight(fromDisplayWeight(weight, unitSystem))
    close()
  })

  return (
    <Sheet open={open} onClose={close} title="Log Weight">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <Field
          label="Today's weight"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={0}
          autoFocus
          suffix={weightUnitLabel(unitSystem)}
          error={errors.weight?.message}
          {...register('weight', { valueAsNumber: true })}
        />
        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          Save
        </Button>
      </form>
    </Sheet>
  )
}
