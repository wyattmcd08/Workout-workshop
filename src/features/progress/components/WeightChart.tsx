import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { UnitSystem, WeightEntry } from '@/types'
import { parseDateKey } from '@/utils/date'
import { toDisplayWeight, weightUnitLabel } from '@/utils/units'

interface WeightChartProps {
  entries: WeightEntry[]
  unitSystem: UnitSystem
  height?: number
}

interface ChartPoint {
  label: string
  weight: number
}

export function WeightChart({ entries, unitSystem, height = 180 }: WeightChartProps) {
  const points = useMemo<ChartPoint[]>(
    () =>
      entries.map((entry) => ({
        label: parseDateKey(entry.dateKey).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        weight: Number(toDisplayWeight(entry.weightKg, unitSystem).toFixed(1)),
      })),
    [entries, unitSystem],
  )

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-content-tertiary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fill: 'var(--color-content-tertiary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(value: number) => `${value}`}
          />
          <Tooltip
            cursor={{ stroke: 'rgb(255 255 255 / 0.15)' }}
            contentStyle={{
              background: 'var(--color-surface-raised)',
              border: '1px solid rgb(255 255 255 / 0.08)',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-content-secondary)' }}
            formatter={(value) => [`${value ?? ''} ${weightUnitLabel(unitSystem)}`, 'Weight']}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            fill="url(#weightFill)"
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
