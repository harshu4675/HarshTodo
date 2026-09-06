import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../lib/cn.js'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { ProgressRing } from '../components/ui/Progress.jsx'
import { Dropdown, MenuItem } from '../components/ui/Dropdown.jsx'
import { TaskCheckbox } from '../components/tasks/TaskCheckbox.jsx'
import { TaskMeta } from '../components/tasks/TaskMeta.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { useUI } from '../app/UIContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useFocusTimer } from '../hooks/useFocusTimer.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useNow } from '../hooks/useNow.js'
import { isOpen, isTaskOverdue, priorityThenDateComparator } from '../lib/taskQueries.js'
import { formatClock, formatDuration, todayKey } from '../lib/dates.js'
import { focusSummary } from '../lib/statistics.js'
import { showNotification } from '../services/notifications.js'
import { TASK_STATUS } from '../constants/task.js'

const DURATIONS = [15, 25, 45, 60, 90]

export default function FocusPage() {
  const { tasks, settings, focusSessions } = useAppState()
  const actions = useAppActions()
  const { openTaskDetails } = useUI()
  const toast = useToast()
  const navigate = useNavigate()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const [pickerOpen, setPickerOpen] = useState(false)

  const onComplete = useCallback(
    async ({ taskId, durationSeconds, sessionStartedAt }) => {
      await actions.recordFocusSession({ taskId, startedAt: sessionStartedAt || new Date().toISOString(), endedAt: new Date().toISOString(), durationSeconds, completed: true })
      if (taskId) await actions.recordFocusTime(taskId, durationSeconds, true)
      toast.success('Focus session complete', { description: 'Take a short break before the next one.' })
      if (settings?.notificationsEnabled) showNotification('Focus session complete', { body: 'Nice work. Take a short break.', tag: 'focus-complete' })
    },
    [actions, toast, settings?.notificationsEnabled],
  )

  const timer = useFocusTimer({ durationMinutes: settings?.focusDefaultMinutes || 25, onComplete })
  const task = timer.taskId ? tasks.find((t) => t.id === timer.taskId && !t.deletedAt) : null
  useDocumentTitle(timer.running ? `${formatClock(timer.remaining)} Focus` : 'Focus')

  useEffect(() => {
    const requested = params.get('task')
    if (requested && requested !== timer.taskId && tasks.some((t) => t.id === requested)) {
      timer.setTask(requested)
      params.delete('task')
      setParams(params, { replace: true })
    }
  }, [params, setParams, tasks, timer])

  const suggestions = useMemo(() => {
    const today = todayKey(now)
    return tasks
      .filter((t) => isOpen(t) && t.id !== timer.taskId)
      .sort((a, b) => {
        const ao = isTaskOverdue(a, now) || a.dueDate === today ? 0 : 1
        const bo = isTaskOverdue(b, now) || b.dueDate === today ? 0 : 1
        return ao - bo || priorityThenDateComparator(a, b)
      })
      .slice(0, 8)
  }, [tasks, timer.taskId, now])

  const todayStats = useMemo(() => focusSummary(focusSessions, 1, now), [focusSessions, now])
  const percent = timer.durationSeconds ? ((timer.durationSeconds - timer.remaining) / timer.durationSeconds) * 100 : 0

  async function stopAndLog() {
    const { elapsedSeconds, taskId, sessionStartedAt } = timer.stop()
    if (elapsedSeconds >= 60) {
      await actions.recordFocusSession({ taskId, startedAt: sessionStartedAt || new Date().toISOString(), endedAt: new Date().toISOString(), durationSeconds: elapsedSeconds, completed: false })
      if (taskId) await actions.recordFocusTime(taskId, elapsedSeconds, false)
      toast.info(`${formatDuration(Math.round(elapsedSeconds / 60))} logged`)
    }
  }

  async function completeTask() {
    if (!task) return
    if (timer.running || timer.elapsed > 0) await stopAndLog()
    await actions.completeTask(task.id)
    toast.success('Task completed')
    timer.setTask(null)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-6 sm:py-10 min-h-dvh lg:min-h-0">
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" icon="chevron-left" onClick={() => navigate(-1)}>
          Back
        </Button>
        <p className="text-xs text-ink-muted tabular">
          {todayStats.sessions ? `${todayStats.sessions} ${todayStats.sessions === 1 ? 'session' : 'sessions'}, ${formatDuration(todayStats.minutes) || '0m'} today` : 'No sessions yet today'}
        </p>
      </div>

      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="relative">
          <ProgressRing value={percent} size={240} stroke={8} label={`${Math.round(percent)} percent of the session elapsed`}>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-semibold tabular tracking-tight text-ink" aria-live={timer.running ? 'off' : 'polite'}>
                {formatClock(timer.remaining)}
              </span>
              <span className="text-xs text-ink-muted mt-1">{timer.running ? 'Focusing' : timer.elapsed > 0 ? 'Paused' : 'Ready'}</span>
            </div>
          </ProgressRing>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon="rotate-ccw" label="Reset timer" size="lg" variant="secondary" onClick={() => timer.reset()} disabled={timer.elapsed === 0 && !timer.running} />
          {timer.running ? (
            <Button size="lg" variant="secondary" icon="pause" onClick={timer.pause} className="w-36">
              Pause
            </Button>
          ) : (
            <Button size="lg" variant="primary" icon="play" onClick={() => timer.start()} className="w-36">
              {timer.elapsed > 0 ? 'Resume' : 'Start'}
            </Button>
          )}
          <Dropdown title="Duration" align="end" trigger={({ toggle, props }) => <Button size="lg" variant="secondary" icon="clock" onClick={toggle} {...props}>{timer.durationSeconds / 60} min</Button>}>
            {DURATIONS.map((m) => (
              <MenuItem key={m} checked={timer.durationSeconds === m * 60} onSelect={() => timer.setDuration(m)}>
                {m} minutes
              </MenuItem>
            ))}
            {task?.estimatedMinutes && !DURATIONS.includes(task.estimatedMinutes) ? (
              <MenuItem checked={timer.durationSeconds === task.estimatedMinutes * 60} onSelect={() => timer.setDuration(task.estimatedMinutes)}>
                Task estimate ({formatDuration(task.estimatedMinutes)})
              </MenuItem>
            ) : null}
          </Dropdown>
        </div>
        {timer.elapsed > 0 && !timer.running ? (
          <Button size="sm" variant="ghost" icon="stop" onClick={stopAndLog}>
            End session and log time
          </Button>
        ) : null}

        <section aria-label="Current task" className="w-full">
          {task ? (
            <div className={cn('rounded-lg border bg-surface p-4 sm:p-5 shadow-xs', timer.running ? 'border-primary/40' : 'border-line')}>
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <TaskCheckbox checked={task.status === TASK_STATUS.COMPLETED} priority={task.priority} title={task.title} onToggle={completeTask} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-muted mb-0.5">Working on</p>
                  <button type="button" onClick={() => openTaskDetails(task.id)} className="text-left text-base font-medium text-ink hover:underline break-words">
                    {task.title}
                  </button>
                  {task.description ? <p className="text-sm text-ink-secondary mt-1 truncate-2">{task.description}</p> : null}
                  <TaskMeta task={task} className="mt-2" now={now} />
                  {task.subtasks.length ? (
                    <ul className="mt-3 flex flex-col gap-1">
                      {task.subtasks.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 text-sm">
                          <TaskCheckbox size="sm" checked={s.completed} title={s.title} onToggle={() => actions.updateSubtask(task.id, s.id, { completed: !s.completed })} />
                          <span className={cn(s.completed && 'line-through text-ink-muted')}>{s.title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <IconButton icon="x" label="Clear current task" size="sm" onClick={() => timer.setTask(null)} />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line-strong bg-surface/50 p-5 text-center">
              <p className="text-sm font-medium text-ink">Choose a task to focus on</p>
              <p className="text-xs text-ink-muted mt-0.5">The timer works without one, but logging time needs a task.</p>
              <Button size="sm" variant="secondary" icon="list-checks" className="mt-3" onClick={() => setPickerOpen((v) => !v)} aria-expanded={pickerOpen}>
                Pick a task
              </Button>
            </div>
          )}
        </section>

        {(pickerOpen || !task) && suggestions.length ? (
          <section aria-label="Suggested tasks" className="w-full">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">{task ? 'Switch to' : 'Suggested'}</h2>
            <ul className="flex flex-col gap-1">
              {suggestions.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      timer.setTask(t.id)
                      setPickerOpen(false)
                      if (t.estimatedMinutes && !timer.running && timer.elapsed === 0) timer.setDuration(Math.min(180, Math.max(5, t.estimatedMinutes)))
                    }}
                    className="w-full flex items-center gap-3 rounded-md border border-line bg-surface px-3 h-11 text-left hover:border-line-strong transition-colors"
                  >
                    <Icon name="target" size={16} className="text-ink-muted shrink-0" />
                    <span className="flex-1 min-w-0 text-sm truncate">{t.title}</span>
                    {t.estimatedMinutes ? <span className="text-xs text-ink-muted tabular">{formatDuration(t.estimatedMinutes)}</span> : null}
                    {isTaskOverdue(t, now) ? <span className="text-xs text-error font-medium">Overdue</span> : t.dueDate === todayKey(now) ? <span className="text-xs text-primary font-medium">Today</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : !task && !suggestions.length ? (
          <EmptyState compact icon="target" title="No open tasks to focus on" description="Add a task first, then come back to start a session." action={{ label: 'Go to inbox', onClick: () => navigate('/inbox') }} />
        ) : null}
      </div>
    </div>
  )
}
