import { useEffect, useRef } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus.js'
import { useToast } from '../components/ui/Toast.jsx'

export function ConnectivityNotice() {
  const online = useOnlineStatus()
  const toast = useToast()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
      toast.info('You are offline', { description: 'Everything keeps working. Changes are saved on this device.' })
    } else if (wasOffline.current) {
      wasOffline.current = false
      toast.success('Back online')
    }
  }, [online, toast])

  return null
}
