import { useEffect, useState } from 'react'
import { useServiceWorker } from './useServiceWorker.js'
import { useToast } from '../components/ui/Toast.jsx'

export function UpdatePrompt() {
  const { needRefresh, offlineReady, error, update } = useServiceWorker()
  const toast = useToast()
  const [announced, setAnnounced] = useState({ refresh: false, offline: false, error: false })

  useEffect(() => {
    if (needRefresh && !announced.refresh) {
      setAnnounced((a) => ({ ...a, refresh: true }))
      toast.info('A new version is available', {
        description: 'Reload to update. Your tasks are safe.',
        duration: 0,
        action: { label: 'Reload', onClick: () => update?.(true) },
      })
    }
  }, [needRefresh, announced.refresh, toast, update])

  useEffect(() => {
    if (offlineReady && !announced.offline) {
      setAnnounced((a) => ({ ...a, offline: true }))
      toast.success('Ready to work offline', { description: 'HarshTodo is cached on this device.' })
    }
  }, [offlineReady, announced.offline, toast])

  useEffect(() => {
    if (error && !announced.error) {
      setAnnounced((a) => ({ ...a, error: true }))
      toast.warning('Offline support could not be enabled', { description: error })
    }
  }, [error, announced.error, toast])

  return null
}
