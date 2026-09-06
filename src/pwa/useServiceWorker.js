import { useSyncExternalStore } from 'react'
import { subscribeServiceWorker, getServiceWorkerState } from './registerServiceWorker.js'

export function useServiceWorker() {
  return useSyncExternalStore(subscribeServiceWorker, getServiceWorkerState, getServiceWorkerState)
}
