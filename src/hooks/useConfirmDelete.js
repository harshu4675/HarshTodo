import { createContext, useCallback, useContext, useState, createElement } from 'react'
import { ConfirmDialog } from '../components/ui/Modal.jsx'
import { useAppState } from '../store/AppStore.jsx'

const ConfirmContext = createContext(null)

export function ConfirmDeleteProvider({ children }) {
  const [pending, setPending] = useState(null)
  const { settings } = useAppState()

  const confirm = useCallback(
    (ids, onConfirm, options = {}) => {
      if (settings && !settings.confirmBeforeDelete && !options.force) {
        onConfirm()
        return
      }
      setPending({ count: Array.isArray(ids) ? ids.length : 1, onConfirm, ...options })
    },
    [settings],
  )

  return createElement(
    ConfirmContext.Provider,
    { value: confirm },
    children,
    createElement(ConfirmDialog, {
      open: Boolean(pending),
      onClose: () => setPending(null),
      onConfirm: () => {
        const run = pending?.onConfirm
        setPending(null)
        run?.()
      },
      title: pending?.title || (pending?.count > 1 ? `Move ${pending.count} tasks to trash?` : 'Move task to trash?'),
      message: pending?.message || 'Trashed tasks can be restored for 30 days before they are removed permanently.',
      confirmLabel: pending?.confirmLabel || 'Move to trash',
    }),
  )
}

export function useConfirmDelete() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirmDelete must be used inside ConfirmDeleteProvider')
  return ctx
}
