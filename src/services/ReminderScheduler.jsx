import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { useUI } from '../app/UIContext.jsx'
import { dueReminders, nextReminderAt, showNotification, notificationSupport } from './notifications.js'
import { formatTimeKey } from '../lib/dates.js'
import { Icon } from '../components/ui/Icon.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Dropdown, MenuItem } from '../components/ui/Dropdown.jsx'
import { SNOOZE_OPTIONS } from '../constants/task.js'

const MAX_TIMEOUT = 2 ** 31 - 1

export function ReminderScheduler() {
  const { tasks, settings, status } = useAppState()
  const actions = useAppActions()
  const { openTaskDetails } = useUI()
  const [banner, setBanner] = useState([])
  const timer = useRef(null)
  const firing = useRef(new Set())

  useEffect(() => {
    if (status !== 'ready') return undefined
    async function check() {
      const now = Date.now()
      const due = dueReminders(tasks, now)
      const support = notificationSupport()
      const useSystem = settings?.notificationsEnabled && support.supported && Notification.permission === 'granted'
      for (const { task } of due) {
        if (firing.current.has(task.id)) continue
        firing.current.add(task.id)
        const body = task.dueTime ? `Due at ${formatTimeKey(task.dueTime)}` : 'Reminder'
        let shown = false
        if (useSystem) shown = await showNotification(task.title, { body, tag: `task-${task.id}`, data: { taskId: task.id }, renotify: true })
        if (!shown) setBanner((list) => (list.some((t) => t.id === task.id) ? list : [...list, task]))
        await actions.markReminderFired(task.id)
        firing.current.delete(task.id)
      }
      schedule()
    }
    function schedule() {
      clearTimeout(timer.current)
      const next = nextReminderAt(tasks, Date.now())
      if (next === null) return
      const delay = Math.min(Math.max(0, next - Date.now()) + 250, MAX_TIMEOUT)
      timer.current = setTimeout(check, delay)
    }
    check()
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [tasks, settings?.notificationsEnabled, status, actions])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined
    const handler = (event) => {
      if (event.data?.type === 'open-task' && event.data.taskId) openTaskDetails(event.data.taskId)
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [openTaskDetails])

  if (!banner.length) return null
  const dismiss = (id) => setBanner((list) => list.filter((t) => t.id !== id))
  return createPortal(
    <div className="fixed z-[65] top-16 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md flex flex-col gap-2" aria-live="assertive">
      {banner.map((task) => (
        <div key={task.id} role="alert" className="flex items-start gap-3 rounded-lg border border-primary/30 bg-elevated shadow-lg px-3.5 py-3 animate-toast-in">
          <Icon name="bell" size={18} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{task.title}</p>
            <p className="text-xs text-ink-muted">{task.dueTime ? `Due at ${formatTimeKey(task.dueTime)}` : 'Reminder'}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <Button size="xs" variant="primary" onClick={() => { actions.completeTask(task.id); dismiss(task.id) }}>
                Complete
              </Button>
              <Button size="xs" variant="secondary" onClick={() => { openTaskDetails(task.id); dismiss(task.id) }}>
                Open
              </Button>
              <Dropdown title="Snooze" trigger={({ toggle, props }) => <Button size="xs" variant="ghost" icon="clock" onClick={toggle} {...props}>Snooze</Button>}>
                {SNOOZE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} onSelect={() => { actions.snoozeReminder(task.id, o.value); dismiss(task.id) }}>
                    {o.label}
                  </MenuItem>
                ))}
              </Dropdown>
            </div>
          </div>
          <button type="button" onClick={() => dismiss(task.id)} aria-label="Dismiss reminder" className="text-ink-muted hover:text-ink p-0.5 -mr-1 rounded-xs">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
