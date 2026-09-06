import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader, Card } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { ProjectEditorDialog } from '../components/projects/ProjectEditorDialog.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ProgressRing } from '../components/ui/Progress.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { selectByProject, isOpen, isCompleted, isTaskOverdue, orderComparator, dateThenOrderComparator, completedAtDescComparator } from '../lib/taskQueries.js'
import { COLOR_BY_ID, PROJECT_STATUS, PROJECT_STATUS_LIST } from '../constants/task.js'
import { formatRelativeDate, todayKey } from '../lib/dates.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useNow } from '../hooks/useNow.js'
import { cn } from '../lib/cn.js'

export default function ProjectPage() {
  const { projectId } = useParams()
  const { projects, tasks } = useAppState()
  const actions = useAppActions()
  const navigate = useNavigate()
  const now = useNow()
  const project = projects.find((p) => p.id === projectId)
  useDocumentTitle(project?.name || 'Project')
  const [editing, setEditing] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [sort, setSort] = useState('manual')

  const data = useMemo(() => {
    const all = selectByProject(tasks, projectId)
    const open = all.filter(isOpen).sort(sort === 'date' ? dateThenOrderComparator : orderComparator)
    const done = all.filter(isCompleted).sort(completedAtDescComparator)
    const overdue = open.filter((t) => isTaskOverdue(t, now)).length
    const total = open.length + done.length
    return { open, done, overdue, total, percent: total ? Math.round((done.length / total) * 100) : 0 }
  }, [tasks, projectId, sort, now])

  if (!project) {
    return (
      <Page>
        <EmptyState icon="folder-kanban" title="Project not found" description="It may have been deleted." action={{ label: 'All projects', onClick: () => navigate('/projects') }} />
      </Page>
    )
  }

  const hex = COLOR_BY_ID[project.color]?.hex
  const status = PROJECT_STATUS_LIST.find((s) => s.value === project.status)
  const projectOverdue = project.dueDate && project.dueDate < todayKey(now) && project.status === PROJECT_STATUS.ACTIVE

  return (
    <Page width="max-w-5xl">
      <PageHeader
        eyebrow="Project"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-9 w-9 rounded-md flex items-center justify-center text-white shrink-0" style={{ backgroundColor: hex }}>
              <Icon name={project.icon} size={18} />
            </span>
            {project.name}
          </span>
        }
        subtitle={project.description || undefined}
        actions={
          <>
            <Button size="sm" variant="secondary" icon="pencil" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {project.status === PROJECT_STATUS.ACTIVE && data.total > 0 && data.open.length === 0 ? (
              <Button size="sm" variant="primary" icon="circle-check" onClick={() => actions.updateProject(project.id, { status: PROJECT_STATUS.COMPLETED })}>
                Mark project complete
              </Button>
            ) : null}
          </>
        }
      >
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {status && project.status !== PROJECT_STATUS.ACTIVE ? <Badge tone={project.status === PROJECT_STATUS.COMPLETED ? 'success' : 'neutral'}>{status.label}</Badge> : null}
          {project.dueDate ? (
            <Badge tone={projectOverdue ? 'error' : 'neutral'} icon="calendar">
              Due {formatRelativeDate(project.dueDate, now)}
            </Badge>
          ) : null}
          {data.overdue ? <Badge tone="error" icon="alert-circle">{data.overdue} overdue</Badge> : null}
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
        <div className="min-w-0">
          <QuickAdd className="mb-4" defaults={{ projectId: project.id }} placeholder={`Add a task to ${project.name}`} />
          <div className="flex items-center justify-end gap-1 mb-1">
            <button type="button" onClick={() => setSort('manual')} aria-pressed={sort === 'manual'} className={cn('text-xs px-2 h-7 rounded-sm', sort === 'manual' ? 'bg-sunken text-ink font-medium' : 'text-ink-muted hover:text-ink')}>
              Manual
            </button>
            <button type="button" onClick={() => setSort('date')} aria-pressed={sort === 'date'} className={cn('text-xs px-2 h-7 rounded-sm', sort === 'date' ? 'bg-sunken text-ink font-medium' : 'text-ink-muted hover:text-ink')}>
              By date
            </button>
          </div>
          <TaskList
            tasks={data.open}
            reorderable={sort === 'manual'}
            showProject={false}
            ariaLabel={`${project.name} tasks`}
            emptyState={
              data.done.length ? (
                <EmptyState icon="circle-check" title="Every task in this project is done" description="Add more work above or mark the project complete." />
              ) : (
                <EmptyState icon="list-todo" title="No tasks in this project yet" description="Break the outcome into concrete next steps and add them above." />
              )
            }
          />
          {data.done.length ? (
            <div className="mt-6">
              <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink mb-2">
                <Icon name={showDone ? 'chevron-down' : 'chevron-right'} size={16} />
                Completed ({data.done.length})
              </button>
              {showDone ? <TaskList tasks={data.done} showProject={false} bulkEnabled={false} compact ariaLabel="Completed project tasks" /> : null}
            </div>
          ) : null}
        </div>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={data.percent} size={64} stroke={5} label={`${data.percent} percent complete`}>
              <span className="text-sm font-semibold tabular">{data.percent}%</span>
            </ProgressRing>
            <div className="text-sm">
              <p className="font-medium tabular">
                {data.done.length} of {data.total} done
              </p>
              <p className="text-xs text-ink-muted tabular">{data.open.length} remaining</p>
            </div>
          </div>
          <dl className="text-xs text-ink-muted flex flex-col gap-1.5 border-t border-line pt-3">
            <div className="flex justify-between"><dt>Created</dt><dd className="text-ink-secondary">{project.createdAt.slice(0, 10)}</dd></div>
            <div className="flex justify-between"><dt>Status</dt><dd className="text-ink-secondary">{status?.label}</dd></div>
            {project.dueDate ? <div className="flex justify-between"><dt>Due</dt><dd className={cn('text-ink-secondary', projectOverdue && 'text-error')}>{project.dueDate}</dd></div> : null}
          </dl>
        </Card>
      </div>
      {editing ? <ProjectEditorDialog open onClose={() => setEditing(false)} project={project} /> : null}
    </Page>
  )
}
