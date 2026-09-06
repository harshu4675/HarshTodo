export function notificationSupport() {
  if (typeof window === 'undefined') return { supported: false, reason: 'unavailable' }
  if (!('Notification' in window)) return { supported: false, reason: 'This browser does not support notifications.' }
  if (!window.isSecureContext) return { supported: false, reason: 'Notifications require a secure (HTTPS) context.' }
  return { supported: true, reason: null, permission: Notification.permission }
}

export async function requestNotificationPermission() {
  const support = notificationSupport()
  if (!support.supported) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const result = await Notification.requestPermission()
    return result
  } catch {
    return 'denied'
  }
}

export async function showNotification(title, options = {}) {
  const support = notificationSupport()
  if (!support.supported || Notification.permission !== 'granted') return false
  const payload = { icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', ...options }
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, payload)
        return true
      }
    }
    const notification = new Notification(title, payload)
    if (options.onClick) notification.onclick = options.onClick
    return true
  } catch {
    return false
  }
}

export function reminderTime(task) {
  if (!task.dueDate || !task.dueTime || task.reminderMinutesBefore === null || task.reminderMinutesBefore === undefined) return null
  if (task.reminderSnoozedUntil) {
    const snoozed = Date.parse(task.reminderSnoozedUntil)
    return Number.isNaN(snoozed) ? null : snoozed
  }
  const [y, m, d] = task.dueDate.split('-').map(Number)
  const [hh, mm] = task.dueTime.split(':').map(Number)
  const due = new Date(y, m - 1, d, hh, mm, 0, 0).getTime()
  return due - task.reminderMinutesBefore * 60000
}

export function dueReminders(tasks, now = Date.now(), graceMs = 6 * 60 * 60 * 1000) {
  const out = []
  for (const task of tasks) {
    if (task.deletedAt || task.status === 'completed' || task.status === 'archived' || task.status === 'cancelled') continue
    const at = reminderTime(task)
    if (at === null) continue
    if (task.reminderFiredAt && !task.reminderSnoozedUntil) continue
    if (at <= now && now - at <= graceMs) out.push({ task, at })
  }
  return out
}

export function nextReminderAt(tasks, now = Date.now()) {
  let next = null
  for (const task of tasks) {
    if (task.deletedAt || task.status === 'completed' || task.status === 'archived' || task.status === 'cancelled') continue
    if (task.reminderFiredAt && !task.reminderSnoozedUntil) continue
    const at = reminderTime(task)
    if (at === null || at <= now) continue
    if (next === null || at < next) next = at
  }
  return next
}
