import { useEffect, useState } from 'react'
import { useServiceWorker } from './useServiceWorker.js'
import { applyUpdate } from './registerServiceWorker.js'
import { useToast } from '../components/ui/Toast.jsx'

export function UpdatePrompt() {
  const { needRefresh, offlineReady, error } = useServiceWorker()
  const toast = useToast()
  const [announced, setAnnounced] = useState({ refresh: false, offline: false, error: false })

  useEffect(() => {
    if (needRefresh && !announced.refresh) {
      setAnnounced((a) => ({ ...a, refresh: true }))
      toast.info('A new version is available', {
        description: 'Reload to update. Your tasks are safe.',
        duration: 0,
        action: {
          label: 'Reload',
          onClick: async () => {
            const result = await applyUpdate()
            if (!result.ok) toast.error('Update failed', { description: `${result.reason} Try closing every HarshTodo tab and reopening.` })
          },
        },
      })
    }
  }, [needRefresh, announced.refresh, toast])

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
