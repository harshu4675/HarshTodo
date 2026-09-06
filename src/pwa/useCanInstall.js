import { useSyncExternalStore } from 'react'
import { subscribeInstall, canInstall } from './installPrompt.js'

export function useCanInstall() {
  return useSyncExternalStore(subscribeInstall, canInstall, () => false)
}
