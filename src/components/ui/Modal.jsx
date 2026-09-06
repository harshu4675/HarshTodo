import { useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn.js'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import { useEscape } from '../../hooks/useEscape.js'
import { IconButton, Button } from './Button.jsx'

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className, closeOnBackdrop = true }) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()
  useFocusTrap(ref, open)
  useScrollLock(open)
  useEscape(open, onClose)
  if (!open) return null
  const width = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : size === 'xl' ? 'sm:max-w-4xl' : 'sm:max-w-lg'
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="presentation">
      <div className="absolute inset-0 bg-ink/30 animate-fade-in" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-surface shadow-lg border border-line flex flex-col max-h-[92dvh] sm:max-h-[85vh] outline-none',
          'rounded-t-xl sm:rounded-xl animate-slide-up sm:animate-scale-in',
          width,
          className,
        )}
      >
        {title ? (
          <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 shrink-0">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-ink leading-6">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="text-sm text-ink-muted mt-0.5">
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton icon="x" label="Close" size="sm" onClick={onClose} className="-mr-1.5 -mt-1" />
          </header>
        ) : null}
        <div className="px-5 pb-5 overflow-y-auto scrollbar-thin flex-1 min-h-0">{children}</div>
        {footer ? <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-line bg-canvas rounded-b-xl shrink-0 pb-safe">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'danger', loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-secondary leading-relaxed">{message}</p>
    </Modal>
  )
}
