import { useMemo, useState } from 'react'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { isOpen, dateThenOrderComparator } from '../lib/taskQueries.js'
import { todayKey, shiftDateKey, formatDateKey, formatRelativeDate, dateKeysInRange } from '../lib/dates.js'
import { useNow } from '../hooks/useNow.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { cn } from '../lib/cn.js'
import { useNavigate } from 'react-router-dom'

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
]

export default function UpcomingPage() {
  useDocumentTitle('Upcoming')
  const { tasks } = useAppState()
  const now = useNow()
  const navigate = useNavigate()
  const [days, setDays] = useState(14)
  const today = todayKey(now)
  const start = shiftDateKey(today, 1)
  const end = shiftDateKey(today, days)

  const { groups, later, all } = useMemo(() => {
    const inRange = tasks.filter((t) => isOpen(t) && t.dueDate && t.dueDate >= start && t.dueDate <= end).sort(dateThenOrderComparator)
    const byDate = new Map()
    for (const t of inRange) {
      if (!byDate.has(t.dueDate)) byDate.set(t.dueDate, [])
      byDate.get(t.dueDate).push(t)
    }
    const keys = dateKeysInRange(start, end)
    const groupList = keys
      .filter((k) => byDate.has(k))
      .map((k) => ({ key: k, label: formatRelativeDate(k, now), sublabel: formatDateKey(k, 'EEE, MMM d'), tasks: byDate.get(k) }))
    const laterTasks = tasks.filter((t) => isOpen(t) && t.dueDate && t.dueDate > end).sort(dateThenOrderComparator)
    return { groups: groupList, later: laterTasks, all: inRange }
  }, [tasks, start, end, now])

  return (
    <Page>
      <PageHeader
        title="Upcoming"
        subtitle={`${formatDateKey(start, 'MMM d')} to ${formatDateKey(end, 'MMM d')}`}
        actions={
          <div role="group" aria-label="Range" className="inline-flex rounded-md border border-line bg-surface p-0.5">
            {RANGES.map((r) => (
              <button key={r.days} type="button" aria-pressed={days === r.days} onClick={() => setDays(r.days)} className={cn('h-7 px-2.5 rounded-sm text-xs font-medium transition-colors', days === r.days ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-sunken')}>
                {r.label}
              </button>
            ))}
          </div>
        }
      />
      <QuickAdd className="mb-5" defaults={{ dueDate: start }} placeholder='Plan ahead, for example "Dentist appointment Friday at 10am"' />
      <TaskList
        groups={groups}
        tasks={all}
        ariaLabel="Upcoming tasks"
        emptyState={
          <EmptyState
            icon="calendar-clock"
            title={`Nothing planned in the next ${days} days`}
            description={later.length ? `${later.length} ${later.length === 1 ? 'task is' : 'tasks are'} scheduled further out.` : 'Schedule tasks with a date and they will appear here, grouped by day.'}
            action={{ label: 'Open calendar', icon: 'calendar', onClick: () => navigate('/calendar') }}
          />
        }
      />
      {later.length && all.length ? (
        <div className="mt-6 flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3">
          <p className="text-sm text-ink-secondary">
            {later.length} more {later.length === 1 ? 'task' : 'tasks'} beyond {formatDateKey(end, 'MMM d')}
          </p>
          {days < 30 ? (
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => setDays(days === 7 ? 14 : 30)}>
              Extend range
            </Button>
          ) : (
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => navigate('/calendar')}>
              Open calendar
            </Button>
          )}
        </div>
      ) : null}
    </Page>
  )
}
