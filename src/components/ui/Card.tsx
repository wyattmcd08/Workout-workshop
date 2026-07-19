import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  onPress?: () => void
}

/**
 * Base surface for all content blocks. Pressable cards get spring feedback;
 * static cards render without motion overhead.
 */
export function Card({ children, className, onPress }: CardProps) {
  const base = cn('rounded-card bg-surface p-4 shadow-card', className)

  if (onPress) {
    return (
      <motion.button
        type="button"
        onClick={onPress}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(base, 'block w-full text-left')}
      >
        {children}
      </motion.button>
    )
  }

  return <div className={base}>{children}</div>
}
