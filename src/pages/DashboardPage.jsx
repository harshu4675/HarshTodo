import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Page, Card, SectionTitle } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { ProgressRing, ProgressBar } from '../components/ui/Progress.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ColorDot } from '../components/ui/Badge.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { isOpen, isTaskOverdue, selectUpcoming, selectCompleted, projectProgress, dateThenOrderComparator, priorityThenDateComparator, completedAtDescComparator } from '../lib/taskQueries.js'
import { todayKey, format, greetingFor, shiftDateKey } from '../lib/dates.js'
import { computeStreak, completionsByDay } from '../lib/statistics.js'
import { useNow } from '../hooks/useNow.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { PROJECT_STATUS, PRIORITY } from '../constants/task.js'
import { ROUTES } from '../constants/navigation.js'

function Stat({ label, value, to, tone }) {
  const content = (
    <div className="flex flex-col gap-0.5">
      <span className={`text-2xl font-semibold tabular tracking-tight ${tone === 'error' && value > 0 ? 'text-error' : 'text-ink'}`}>{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  )
  return to ? (
    <Link to={to} className="rounded-md px-3 py-2 -mx-3 hover:bg-sunken transition-colors">
      {content}
    </Link>
  ) : (
    <div className="px-3 py-2 -mx-3">{content}</div>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { tasks, projects, settings } = useAppState()
  const navigate = useNavigate()
  const now = useNow()
  const today = todayKey(now)

  const data = useMemo(() => {
    const open = tasks.filter(isOpen)
    const dueToday = open.filter((t) => t.dueDate === today).sort((a, b) => (a.dueTime || 'zz').localeCompare(b.dueTime || 'zz'))
    const overdue = open.filter((t) => isTaskOverdue(t, now) && t.dueDate !== today).sort(dateThenOrderComparator)
    const upcoming = selectUpcoming(tasks, 7, now).sort(dateThenOrderComparator).slice(0, 6)
    const priority = open.filter((t) => t.priority >= PRIORITY.HIGH && t.dueDate !== today).sort(priorityThenDateComparator).slice(0, 5)
    const completedToday = selectCompleted(tasks).filter((t) => t.completedAt?.slice(0, 10) === today)
    const recentlyCompleted = selectCompleted(tasks).sort(completedAtDescComparator).slice(0, 5)
    const todayTotal = dueToday.length + completedToday.length
    const percent = todayTotal ? Math.round((completedToday.length / todayTotal) * 100) : 0
    const activeProjects = projects
      .filter((p) => p.status === PROJECT_STATUS.ACTIVE)
      .map((p) => ({ project: p, progress: projectProgress(tasks, p.id) }))
      .filter((x) => x.progress.total > 0)
      .sort((a, b) => b.progress.open - a.progress.open)
      .slice(0, 5)
    const week = completionsByDay(tasks, 7, now)
    const weekTotal = week.reduce((s, d) => s + d.count, 0)
    const streak = computeStreak(tasks, now)
    return { dueToday, overdue, upcoming, priority, completedToday, recentlyCompleted, percent, activeProjects, weekTotal, streak, openCount: open.length }
  }, [tasks, projects, now, today])

  const name = settings?.displayName?.trim()
  const focusList = [...data.overdue, ...data.dueToday]

  return (
    <Page width="max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-ink-muted">{format(now, 'EEEE, MMMM d, yyyy')}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mt-0.5">
            {greetingFor(now)}
            {name ? `, ${name}` : ''}
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            {focusList.length === 0
              ? data.completedToday.length
                ? `You have finished everything planned for today.`
                : 'Nothing is scheduled for today yet.'
              : `${focusList.length} ${focusList.length === 1 ? 'task' : 'tasks'} on your plate${data.overdue.length ? `, ${data.overdue.length} overdue` : ''}.`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing value={data.percent} size={64} stroke={5} label={`${data.percent} percent of today's tasks completed`}>
            <span className="text-sm font-semibold tabular">{data.percent}%</span>
          </ProgressRing>
          <div className="text-sm">
            <p className="font-medium text-ink tabular">
              {data.completedToday.length} of {data.dueToday.length + data.completedToday.length} done today
            </p>
            <p className="text-ink-muted text-xs mt-0.5">
              {data.streak > 0 ? `${data.streak}-day completion streak` : 'Complete a task to start a streak'}
            </p>
          </div>
        </div>
      </div>

      <QuickAdd className="mb-6" placeholder='What is on your mind? Try "Prepare slides Thursday at 2pm #work"' />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mb-6 px-1">
        <Stat label="Due today" value={data.dueToday.length} to={ROUTES.TODAY} />
        <Stat label="Overdue" value={data.overdue.length} to={`${ROUTES.TASKS}?overdue=1`} tone="error" />
        <Stat label="Completed this week" value={data.weekTotal} to={ROUTES.STATISTICS} />
        <Stat label="Open tasks" value={data.openCount} to={ROUTES.TASKS} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <section aria-labelledby="dash-today">
            <SectionTitle action={<Button size="xs" variant="ghost" iconRight="arrow-right" onClick={() => navigate(ROUTES.TODAY)}>Open today</Button>}>
              <span id="dash-today">Today</span>
            </SectionTitle>
            <TaskList
              tasks={focusList.slice(0, 8)}
              bulkEnabled={false}
              ariaLabel="Today's tasks"
              emptyState={<EmptyState compact icon="sun" title="A clear day" description="Add a task above or pull one in from upcoming." />}
            />
            {focusList.length > 8 ? (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => navigate(ROUTES.TODAY)}>
                {focusList.length - 8} more today
              </Button>
            ) : null}
          </section>

          {data.priority.length ? (
            <section aria-labelledby="dash-priority">
              <SectionTitle action={<Button size="xs" variant="ghost" iconRight="arrow-right" onClick={() => navigate(ROUTES.PRIORITIES)}>All priorities</Button>}>
                <span id="dash-priority">High priority</span>
              </SectionTitle>
              <TaskList tasks={data.priority} bulkEnabled={false} compact ariaLabel="High priority tasks" />
            </section>
          ) : null}

          <section aria-labelledby="dash-upcoming">
            <SectionTitle action={<Button size="xs" variant="ghost" iconRight="arrow-right" onClick={() => navigate(ROUTES.UPCOMING)}>Upcoming</Button>}>
              <span id="dash-upcoming">Next 7 days</span>
            </SectionTitle>
            <TaskList
              tasks={data.upcoming}
              bulkEnabled={false}
              compact
              ariaLabel="Upcoming tasks"
              emptyState={<EmptyState compact icon="calendar-clock" title="Nothing scheduled this week" description="Give tasks a date to see them here." action={{ label: 'Open calendar', onClick: () => navigate(ROUTES.CALENDAR) }} />}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <SectionTitle action={<Link to={ROUTES.PROJECTS} className="text-xs text-primary hover:underline">All</Link>}>Projects</SectionTitle>
            {data.activeProjects.length ? (
              <ul className="flex flex-col gap-3">
                {data.activeProjects.map(({ project, progress }) => (
                  <li key={project.id}>
                    <Link to={`/projects/${project.id}`} className="flex flex-col gap-1.5 rounded-md -mx-2 px-2 py-1.5 hover:bg-sunken transition-colors">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <ColorDot color={project.color} />
                          <span className="truncate text-ink">{project.name}</span>
                        </span>
                        <span className="text-xs text-ink-muted tabular shrink-0">
                          {progress.done}/{progress.total}
                        </span>
                      </div>
                      <ProgressBar value={progress.percent} size="sm" label={`${project.name} progress`} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-ink-muted">
                Group related tasks into projects to track progress.
                <Button size="sm" variant="secondary" icon="plus" className="mt-3 w-full" onClick={() => navigate(`${ROUTES.PROJECTS}?new=1`)}>
                  Create a project
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle action={<Link to={ROUTES.COMPLETED} className="text-xs text-primary hover:underline">History</Link>}>Recently completed</SectionTitle>
            {data.recentlyCompleted.length ? (
              <ul className="flex flex-col gap-2">
                {data.recentlyCompleted.map((t) => (
                  <li key={t.id} className="flex items-start gap-2 text-sm">
                    <Icon name="circle-check" size={16} className="text-success mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-ink-secondary line-through decoration-ink-faint">{t.title}</p>
                      <p className="text-xs text-ink-muted">{t.completedAt?.slice(0, 10) === today ? format(new Date(t.completedAt), 'h:mm a') : t.completedAt?.slice(0, 10) === shiftDateKey(today, -1) ? 'Yesterday' : format(new Date(t.completedAt), 'MMM d')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Completed tasks will show up here.</p>
            )}
          </Card>

          <Card className="bg-primary-soft/40 border-primary/15">
            <div className="flex items-start gap-3">
              <Icon name="timer" size={18} className="text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Focus mode</p>
                <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed">Pick one task and work in timed sessions without distractions.</p>
                <Button size="sm" variant="primary" className="mt-3" onClick={() => navigate(ROUTES.FOCUS)}>
                  Start a session
                </Button>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  )
}
