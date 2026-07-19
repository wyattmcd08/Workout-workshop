import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { clamp } from '@/utils/format'

interface ProgressRingProps {
  /** 0–1 fill fraction. Values beyond 1 are clamped. */
  progress: number
  size: number
  strokeWidth: number
  color: string
  trackColor?: string
  children?: ReactNode
}

export function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor = 'rgb(255 255 255 / 0.08)',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = clamp(progress, 0, 1)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - fraction) }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        />
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  )
}
