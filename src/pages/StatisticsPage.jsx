import { useMemo, useState } from 'react'
import { Page, PageHeader, Card, SectionTitle } from '../components/layout/PageHeader.jsx'
import { ProgressBar } from '../components/ui/Progress.jsx'
import { PriorityFlag, ColorDot } from '../components/ui/Badge.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { useNow } from '../hooks/useNow.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { completionsByDay, computeStreak, completionRate, priorityBreakdown, overdueAnalysis, statusBreakdown, estimateAccuracy, focusSummary, busiestWeekday } from '../lib/statistics.js'
import { projectProgress } from '../lib/taskQueries.js'
import { formatDuration } from '../lib/dates.js'
import { WEEKDAYS, TASK_STATUS_LIST, PROJECT_STATUS } from '../constants/task.js'
import { cn } from '../lib/cn.js'
import { useNavigate } from 'react-router-dom'

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

function Metric({ label, value, hint }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-2xl font-semibold tabular tracking-tight text-ink">{value}</span>
      {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </Card>
  )
}

function BarChart({ data, label }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const many = data.length > 14
  return (
    <div role="img" aria-label={label} className="flex items-end gap-px sm:gap-1 h-32">
      {data.map((d) => (
        <div key={d.key} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.key}: ${d.count}`}>
          <div className="w-full flex-1 flex items-end">
            <div className={cn('w-full rounded-t-sm transition-[height] duration-slow', d.count ? 'bg-primary' : 'bg-line')} style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%` }} />
          </div>
          {!many || data.indexOf(d) % Math.ceil(data.length / 10) === 0 ? <span className="text-[10px] text-ink-muted tabular truncate">{many ? d.shortLabel : d.label}</span> : <span className="text-[10px]">&nbsp;</span>}
        </div>
      ))}
    </div>
  )
}

export default function StatisticsPage() {
  useDocumentTitle('Statistics')
  const { tasks, projects, focusSessions } = useAppState()
  const now = useNow()
  const navigate = useNavigate()
  const [days, setDays] = useState(7)

  const data = useMemo(() => {
    const series = completionsByDay(tasks, days, now)
    const total = series.reduce((s, d) => s + d.count, 0)
    const best = series.reduce((a, b) => (b.count > a.count ? b : a), series[0])
    const rate = completionRate(tasks, days, now)
    const projectRows = projects
      .filter((p) => p.status === PROJECT_STATUS.ACTIVE)
      .map((p) => ({ project: p, progress: projectProgress(tasks, p.id) }))
      .filter((r) => r.progress.total)
      .sort((a, b) => b.progress.percent - a.progress.percent)
    return {
      series,
      total,
      best,
      average: (total / days).toFixed(1),
      streak: computeStreak(tasks, now),
      rate,
      priorities: priorityBreakdown(tasks),
      overdue: overdueAnalysis(tasks, now),
      statuses: statusBreakdown(tasks),
      estimate: estimateAccuracy(tasks),
      focus: focusSummary(focusSessions, days, now),
      projectRows,
      weekday: busiestWeekday(tasks),
    }
  }, [tasks, projects, focusSessions, days, now])

  const hasAnyData = tasks.some((t) => !t.deletedAt)
  const openTotal = data.priorities.reduce((s, p) => s + p.count, 0)

  if (!hasAnyData) {
    return (
      <Page>
        <PageHeader title="Statistics" />
        <EmptyState icon="bar-chart-3" title="No activity to analyze yet" description="Complete a few tasks and this page will show your completion trends, streaks and project progress." action={{ label: 'Go to today', onClick: () => navigate('/today') }} />
      </Page>
    )
  }

  return (
    <Page width="max-w-6xl">
      <PageHeader
        title="Statistics"
        subtitle="How your work is flowing. Everything is computed locally."
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Metric label={`Completed in ${days} days`} value={data.total} hint={`${data.average} per day`} />
        <Metric label="Current streak" value={`${data.streak}d`} hint={data.streak ? 'Consecutive days with a completion' : 'Complete a task today to start'} />
        <Metric label="Created vs completed" value={`${data.rate.created} / ${data.rate.completed}`} hint={data.rate.created > data.rate.completed ? 'Backlog growing' : 'Keeping up'} />
        <Metric label="Focus time" value={formatDuration(data.focus.minutes) || '0m'} hint={`${data.focus.sessions} ${data.focus.sessions === 1 ? 'session' : 'sessions'}, ${data.focus.completed} finished`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle action={data.best?.count ? <span className="text-xs text-ink-muted">Best day: {data.best.key} ({data.best.count})</span> : null}>Completions per day</SectionTitle>
          <BarChart data={data.series} label={`Tasks completed per day over the last ${days} days`} />
        </Card>

        <Card>
          <SectionTitle>Open by priority</SectionTitle>
          {openTotal ? (
            <ul className="flex flex-col gap-2.5">
              {data.priorities.map((p) => (
                <li key={p.value} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {p.value > 0 ? <PriorityFlag priority={p.value} /> : null}
                      <span className="text-ink-secondary">{p.label}</span>
                    </span>
                    <span className="tabular text-ink">{p.count}</span>
                  </div>
                  <ProgressBar value={(p.count / openTotal) * 100} size="sm" label={`${p.label} share`} tone={p.value >= 3 ? 'warning' : 'primary'} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No open tasks.</p>
          )}
        </Card>

        <Card>
          <SectionTitle action={data.overdue.total ? <button type="button" onClick={() => navigate('/tasks?overdue=1')} className="text-xs text-primary hover:underline">View</button> : null}>Overdue analysis</SectionTitle>
          {data.overdue.total ? (
            <>
              <p className="text-2xl font-semibold tabular text-error mb-3">{data.overdue.total}</p>
              <ul className="flex flex-col gap-2">
                {data.overdue.buckets.map((b) => (
                  <li key={b.label} className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">{b.label}</span>
                    <span className="tabular">{b.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Nothing is overdue. Well managed.</p>
          )}
        </Card>

        <Card>
          <SectionTitle>Task states</SectionTitle>
          <ul className="flex flex-col gap-2">
            {TASK_STATUS_LIST.map((s) => (
              <li key={s.value} className="flex items-center justify-between text-sm">
                <span className="text-ink-secondary">{s.label}</span>
                <span className="tabular">{data.statuses[s.value] || 0}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Habits</SectionTitle>
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-ink-muted text-xs">Most productive weekday</dt>
              <dd className="font-medium">{data.weekday !== null ? WEEKDAYS[data.weekday].label : 'Not enough data'}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-xs">Estimate accuracy</dt>
              <dd className="font-medium">
                {data.estimate
                  ? `${Math.round(data.estimate.ratio * 100)}% of estimate across ${data.estimate.count} ${data.estimate.count === 1 ? 'task' : 'tasks'}`
                  : 'Log focus time on estimated tasks to see this'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle>Project progress</SectionTitle>
          {data.projectRows.length ? (
            <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3">
              {data.projectRows.map(({ project, progress }) => (
                <li key={project.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <ColorDot color={project.color} />
                      <span className="truncate">{project.name}</span>
                    </span>
                    <span className="tabular text-ink-muted text-xs">
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                  <ProgressBar value={progress.percent} size="sm" label={`${project.name} progress`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Active projects with tasks will appear here.</p>
          )}
        </Card>
      </div>
    </Page>
  )
}
