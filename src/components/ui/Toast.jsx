import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn.js'
import { Icon } from './Icon.jsx'
import { createId } from '../../lib/id.js'

const ToastContext = createContext(null)

const TONE_ICON = { success: 'circle-check', error: 'alert-circle', info: 'info', warning: 'alert-triangle' }
const TONE_CLASS = { success: 'text-success', error: 'text-error', info: 'text-info', warning: 'text-warning' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    ({ title, description, tone = 'info', action, duration = 5000 }) => {
      const id = createId()
      setToasts((list) => [...list.slice(-3), { id, title, description, tone, action }])
      if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration))
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (title, opts) => push({ title, tone: 'success', ...opts }),
      error: (title, opts) => push({ title, tone: 'error', duration: 8000, ...opts }),
      info: (title, opts) => push({ title, tone: 'info', ...opts }),
      warning: (title, opts) => push({ title, tone: 'warning', ...opts }),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-atomic="false"
          className="fixed z-[70] bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-elevated shadow-md px-3.5 py-3 animate-toast-in"
            >
              <Icon name={TONE_ICON[toast.tone]} size={18} className={cn('mt-0.5 shrink-0', TONE_CLASS[toast.tone])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink leading-5">{toast.title}</p>
                {toast.description ? <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{toast.description}</p> : null}
                {toast.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action.onClick()
                      dismiss(toast.id)
                    }}
                    className="mt-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    {toast.action.label}
                  </button>
                ) : null}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="text-ink-muted hover:text-ink rounded-xs p-0.5 -mr-1">
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
