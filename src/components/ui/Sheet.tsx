import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * iOS-style bottom sheet: backdrop, spring slide-up, drag-to-dismiss,
 * safe-area aware. Rendered in a portal so it always sits above the shell.
 *
 * Layout is a flex column with a bounded body, so long content scrolls
 * *inside* the sheet instead of overflowing behind it. Drag-to-dismiss is
 * confined to the header handle (via drag controls) so it never competes
 * with scrolling the body.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const dragControls = useDragControls()

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-surface-raised"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            {/* Header is the drag handle; the body below scrolls natively. */}
            <div
              className="shrink-0 touch-none"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-white/20" />
              <div className="flex items-center justify-between px-5 pt-3 pb-1">
                <h2 className="text-[19px] font-bold">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-label="Close"
                  className="flex size-8 items-center justify-center rounded-full bg-white/10 text-content-secondary"
                >
                  <XMarkIcon className="size-4.5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-safe">
              <div className="pb-6">{children}</div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
