import { registerSW } from 'virtual:pwa-register'

const listeners = new Set()
let state = { needRefresh: false, offlineReady: false, error: null, update: null }

function setState(patch) {
  state = { ...state, ...patch }
  for (const fn of listeners) fn(state)
}

export function subscribeServiceWorker(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getServiceWorkerState() {
  return state
}

export function initServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return
  try {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setState({ needRefresh: true })
      },
      onOfflineReady() {
        setState({ offlineReady: true })
      },
      onRegisterError(error) {
        setState({ error: error?.message || 'Service worker registration failed.' })
      },
      onRegisteredSW(url, registration) {
        if (!registration) return
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
      },
    })
    setState({ update })
  } catch (error) {
    setState({ error: error?.message || 'Service worker registration failed.' })
  }
}
