let deferredPrompt = null
const listeners = new Set()

function notify() {
  for (const fn of listeners) fn()
}

export function initInstallPrompt() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    try {
      localStorage.setItem('harshtodo.installed', '1')
    } catch {}
    notify()
  })
}

export function subscribeInstall(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function canInstall() {
  return deferredPrompt !== null
}

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'
  const event = deferredPrompt
  deferredPrompt = null
  notify()
  event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function installPlatformHint() {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}
