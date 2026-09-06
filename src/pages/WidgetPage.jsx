import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn.js'
import { TaskCheckbox } from '../components/tasks/TaskCheckbox.jsx'
import { ProgressBar } from '../components/ui/Progress.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { LogoMark } from '../components/layout/Logo.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { useNow } from '../hooks/useNow.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { isOpen, isTaskOverdue, selectCompleted } from '../lib/taskQueries.js'
import { todayKey, formatTimeKey, format, timeKeyToMinutes } from '../lib/dates.js'
import { parseTaskInput } from '../lib/naturalLanguage.js'

export default function WidgetPage() {
  useDocumentTitle('Compact view')
  const { tasks } = useAppState()
  const actions = useAppActions()
  const now = useNow(30000)
  const today = todayKey(now)
  const [value, setValue] = useState('')
  const [tab, setTab] = useState('today')

  const data = useMemo(() => {
    const open = tasks.filter(isOpen)
    const dueToday = open.filter((t) => t.dueDate === today).sort((a, b) => (a.dueTime || 'zz').localeCompare(b.dueTime || 'zz'))
    const overdue = open.filter((t) => isTaskOverdue(t, now) && t.dueDate !== today)
    const doneToday = selectCompleted(tasks).filter((t) => t.completedAt?.slice(0, 10) === today)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const next = dueToday.find((t) => t.dueTime && timeKeyToMinutes(t.dueTime) >= nowMinutes) || dueToday.find((t) => !t.dueTime) || null
    const total = dueToday.length + doneToday.length
    return { dueToday, overdue, doneToday, next, percent: total ? Math.round((doneToday.length / total) * 100) : 0 }
  }, [tasks, today, now])

  async function submit(e) {
    e.preventDefault()
    const parsed = parseTaskInput(value)
    if (!parsed.title) return
    await actions.addTask({ title: parsed.title, dueDate: parsed.dueDate || today, dueTime: parsed.dueTime, priority: parsed.priority ?? 0, recurrence: parsed.recurrence })
    setValue('')
  }

  const list = tab === 'today' ? data.dueToday : data.overdue

  return (
    <div className="min-h-dvh bg-canvas flex flex-col max-w-md mx-auto w-full">
      <header className="flex items-center gap-2 px-4 h-12 border-b border-line bg-surface sticky top-0">
        <LogoMark size={22} />
        <span className="text-sm font-semibold">{format(now, 'EEE, MMM d')}</span>
        <div className="flex-1" />
        <Link to="/today" className="text-xs text-primary font-medium inline-flex items-center gap-1">
          Open app <Icon name="arrow-up-right" size={12} />
        </Link>
      </header>

      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
          <span>
            {data.doneToday.length} of {data.dueToday.length + data.doneToday.length} done
          </span>
          <span className="tabular">{data.percent}%</span>
        </div>
        <ProgressBar value={data.percent} label="Today's progress" size="sm" />
      </div>

      {data.next ? (
        <div className="mx-4 mt-3 rounded-md border border-primary/30 bg-primary-soft/50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">Up next</p>
          <p className="text-sm text-ink truncate">{data.next.title}</p>
          {data.next.dueTime ? <p className="text-xs text-ink-muted">{formatTimeKey(data.next.dueTime)}</p> : null}
        </div>
      ) : null}

      <form onSubmit={submit} className="mx-4 mt-3 flex items-center gap-2 h-10 rounded-md border border-line bg-surface px-2.5 focus-within:border-primary">
        <Icon name="plus" size={16} className="text-ink-muted" />
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Quick add for today" aria-label="Quick add" className="flex-1 bg-transparent text-sm outline-none" />
      </form>

      <div className="flex items-center gap-1 px-4 mt-3" role="tablist" aria-label="Task groups">
        <button role="tab" type="button" aria-selected={tab === 'today'} onClick={() => setTab('today')} className={cn('h-7 px-2.5 rounded-sm text-xs font-medium', tab === 'today' ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-sunken')}>
          Today ({data.dueToday.length})
        </button>
        <button role="tab" type="button" aria-selected={tab === 'overdue'} onClick={() => setTab('overdue')} className={cn('h-7 px-2.5 rounded-sm text-xs font-medium', tab === 'overdue' ? 'bg-ink text-white' : data.overdue.length ? 'text-error hover:bg-error-soft' : 'text-ink-secondary hover:bg-sunken')}>
          Overdue ({data.overdue.length})
        </button>
      </div>

      <ul className="flex flex-col gap-1 px-4 py-3" aria-label={tab === 'today' ? "Today's tasks" : 'Overdue tasks'}>
        {list.length ? (
          list.map((t) => (
            <li key={t.id} className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-2.5 h-11">
              <TaskCheckbox size="sm" checked={false} priority={t.priority} title={t.title} onToggle={() => actions.completeTask(t.id)} />
              <span className="flex-1 min-w-0 text-sm truncate">{t.title}</span>
              {t.dueTime ? <span className="text-xs text-ink-muted tabular">{formatTimeKey(t.dueTime)}</span> : null}
            </li>
          ))
        ) : (
          <li className="text-sm text-ink-muted text-center py-6">{tab === 'today' ? 'Nothing left for today.' : 'Nothing overdue.'}</li>
        )}
      </ul>
    </div>
  )
}
