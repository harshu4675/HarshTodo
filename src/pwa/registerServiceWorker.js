import { registerSW } from 'virtual:pwa-register'

const listeners = new Set()
let state = { needRefresh: false, offlineReady: false, error: null, update: null, registration: null, checking: false, lastChecked: null }

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
        setState({ registration })
        setInterval(() => checkForUpdates(), 60 * 60 * 1000)
      },
    })
    setState({ update })
  } catch (error) {
    setState({ error: error?.message || 'Service worker registration failed.' })
  }
}

export async function checkForUpdates() {
  const { registration } = state
  if (!registration) return { ok: false, reason: 'Service worker is not registered.' }
  if (!navigator.onLine) return { ok: false, reason: 'You are offline.' }
  setState({ checking: true })
  try {
    await registration.update()
    setState({ checking: false, lastChecked: Date.now() })
    return { ok: true, needRefresh: state.needRefresh }
  } catch (error) {
    setState({ checking: false, lastChecked: Date.now() })
    return { ok: false, reason: error?.message || 'Update check failed.' }
  }
}

export async function applyUpdate() {
  const { update } = state
  if (!update) return { ok: false, reason: 'No update handler available.' }
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('The new version did not activate in time.')), 8000))
    await Promise.race([update(true), timeout])
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error?.message || 'Could not apply the update.' }
  }
}
