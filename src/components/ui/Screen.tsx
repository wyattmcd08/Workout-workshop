import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScreenProps {
  title: string
  subtitle?: string
  headerAccessory?: ReactNode
  children: ReactNode
}

/**
 * Standard page chrome: safe-area padding, large iOS-style title, subtle
 * entrance animation, and bottom clearance for the tab bar.
 */
export function Screen({ title, subtitle, headerAccessory, children }: ScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="mx-auto w-full max-w-lg px-4 pt-safe pb-tabbar"
    >
      <header className="flex items-end justify-between pt-6 pb-4">
        <div>
          {subtitle ? (
            <p className="text-[13px] font-semibold tracking-wide text-content-secondary uppercase">
              {subtitle}
            </p>
          ) : null}
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">{title}</h1>
        </div>
        {headerAccessory}
      </header>
      {children}
    </motion.div>
  )
}
