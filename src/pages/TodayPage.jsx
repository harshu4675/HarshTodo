import { useMemo } from 'react'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { ProgressRing } from '../components/ui/Progress.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { isOpen, isTaskOverdue, dateThenOrderComparator, orderComparator } from '../lib/taskQueries.js'
import { todayKey, format, shiftDateKey } from '../lib/dates.js'
import { useNow } from '../hooks/useNow.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useUI } from '../app/UIContext.jsx'

export default function TodayPage() {
  useDocumentTitle('Today')
  const { tasks } = useAppState()
  const actions = useAppActions()
  const toast = useToast()
  const navigate = useNavigate()
  const now = useNow()
  const today = todayKey(now)
  const [params, setParams] = useSearchParams()
  const { openTaskDetails } = useUI()

  useEffect(() => {
    const id = params.get('task')
    if (id) {
      openTaskDetails(id)
      params.delete('task')
      setParams(params, { replace: true })
    }
  }, [params, setParams, openTaskDetails])

  const { overdue, dueToday, completedToday, percent } = useMemo(() => {
    const overdueList = tasks.filter((t) => isTaskOverdue(t, now) && t.dueDate !== today).sort(dateThenOrderComparator)
    const todayList = tasks.filter((t) => isOpen(t) && t.dueDate === today).sort((a, b) => (a.dueTime || 'zz').localeCompare(b.dueTime || 'zz') || orderComparator(a, b))
    const done = tasks.filter((t) => !t.deletedAt && t.status === 'completed' && t.completedAt && t.completedAt.slice(0, 10) === today)
    const total = todayList.length + done.length + overdueList.length
    return { overdue: overdueList, dueToday: todayList, completedToday: done, percent: total ? Math.round((done.length / total) * 100) : 0 }
  }, [tasks, now, today])

  const groups = [
    { key: 'overdue', label: 'Overdue', tone: 'error', tasks: overdue },
    { key: 'today', label: 'Today', sublabel: format(now, 'EEEE, MMMM d'), tasks: dueToday },
  ]

  async function rescheduleOverdue() {
    const ids = overdue.map((t) => t.id)
    await actions.setDueDate(ids, today)
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} moved to today`)
  }

  return (
    <Page>
      <PageHeader
        title="Today"
        subtitle={format(now, 'EEEE, MMMM d')}
        actions={
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold tabular text-ink">{completedToday.length} done</p>
              <p className="text-xs text-ink-muted tabular">{dueToday.length + overdue.length} remaining</p>
            </div>
            <ProgressRing value={percent} size={44} stroke={4} label={`${percent} percent of today's tasks completed`}>
              <span className="text-[11px] font-semibold tabular">{percent}%</span>
            </ProgressRing>
          </div>
        }
      />
      <QuickAdd className="mb-5" defaults={{ dueDate: today }} placeholder='Add a task for today, for example "Review pull requests at 3pm"' />
      {overdue.length ? (
        <div className="flex items-center justify-between gap-3 mb-3 rounded-md bg-error-soft/60 border border-error/15 px-3 py-2">
          <p className="text-sm text-error">
            {overdue.length} overdue {overdue.length === 1 ? 'task needs' : 'tasks need'} attention.
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="xs" variant="secondary" onClick={rescheduleOverdue}>
              Move to today
            </Button>
            <Button size="xs" variant="ghost" onClick={() => actions.setDueDate(overdue.map((t) => t.id), shiftDateKey(today, 1)).then(() => toast.success('Moved to tomorrow'))}>
              Tomorrow
            </Button>
          </div>
        </div>
      ) : null}
      <TaskList
        groups={groups}
        tasks={[...overdue, ...dueToday]}
        ariaLabel="Today's tasks"
        emptyState={
          completedToday.length ? (
            <EmptyState icon="circle-check" title="All done for today" description={`You completed ${completedToday.length} ${completedToday.length === 1 ? 'task' : 'tasks'}. Plan tomorrow or take a well-earned break.`} action={{ label: 'Plan upcoming', icon: 'calendar-clock', onClick: () => navigate('/upcoming') }} />
          ) : (
            <EmptyState icon="sun" title="Nothing scheduled for today" description="Pull something in from your inbox or add a task above to give the day some shape." action={{ label: 'Open inbox', icon: 'inbox', onClick: () => navigate('/inbox') }} />
          )
        }
      />
    </Page>
  )
}
