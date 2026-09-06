import { useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn.js'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import { useEscape } from '../../hooks/useEscape.js'
import { useBreakpoint } from '../../hooks/useMediaQuery.js'
import { IconButton } from './Button.jsx'

export function Drawer({ open, onClose, title, children, side = 'right', width = 'sm:max-w-md', className, header, hideHeader = false }) {
  const ref = useRef(null)
  const titleId = useId()
  const { isMobile } = useBreakpoint()
  useFocusTrap(ref, open)
  useScrollLock(open)
  useEscape(open, onClose)
  if (!open) return null
  const mobile = isMobile
  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-ink/30 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'absolute bg-surface shadow-lg flex flex-col outline-none',
          mobile
            ? 'inset-x-0 bottom-0 max-h-[94dvh] rounded-t-xl border-t border-line animate-slide-up'
            : cn('inset-y-0 w-full border-line animate-slide-in-right', side === 'right' ? 'right-0 border-l' : 'left-0 border-r', width),
          className,
        )}
      >
        {mobile ? <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong shrink-0" /> : null}
        {!hideHeader ? (
          <header className="flex items-center justify-between gap-3 px-4 sm:px-5 h-14 shrink-0 border-b border-line">
            {header || (
              <h2 id={titleId} className="text-sm font-semibold text-ink truncate">
                {title}
              </h2>
            )}
            <IconButton icon="x" label="Close" size="sm" onClick={onClose} />
          </header>
        ) : null}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pb-safe">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function BottomSheet({ open, onClose, title, children, className }) {
  const ref = useRef(null)
  const titleId = useId()
  useFocusTrap(ref, open)
  useScrollLock(open)
  useEscape(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="presentation">
      <div className="absolute inset-0 bg-ink/30 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full sm:max-w-sm bg-surface border border-line shadow-lg rounded-t-xl sm:rounded-xl max-h-[85dvh] flex flex-col outline-none animate-slide-up sm:animate-scale-in',
          className,
        )}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong shrink-0 sm:hidden" />
        {title ? (
          <h2 id={titleId} className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {title}
          </h2>
        ) : null}
        <div className="overflow-y-auto scrollbar-thin px-2 pb-2 pb-safe">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
