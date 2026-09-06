import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon.jsx'
import { ProgressBar } from '../ui/Progress.jsx'
import { Badge } from '../ui/Badge.jsx'
import { COLOR_BY_ID, PROJECT_STATUS } from '../../constants/task.js'
import { formatRelativeDate, todayKey } from '../../lib/dates.js'
import { cn } from '../../lib/cn.js'

export function ProjectCard({ project, progress, actions }) {
  const hex = COLOR_BY_ID[project.color]?.hex
  const overdue = project.dueDate && project.dueDate < todayKey() && project.status === PROJECT_STATUS.ACTIVE
  return (
    <article className={cn('relative flex flex-col rounded-lg border border-line bg-surface shadow-xs hover:border-line-strong transition-colors', project.status === PROJECT_STATUS.ARCHIVED && 'opacity-70')}>
      <Link to={`/projects/${project.id}`} className="flex flex-col gap-3 p-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <div className="flex items-start gap-3">
          <span className="h-9 w-9 rounded-md flex items-center justify-center text-white shrink-0" style={{ backgroundColor: hex }}>
            <Icon name={project.icon} size={18} />
          </span>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-sm font-semibold text-ink truncate">{project.name}</h3>
            {project.description ? <p className="text-xs text-ink-muted truncate-2 mt-0.5">{project.description}</p> : null}
          </div>
        </div>
        <ProgressBar value={progress.percent} label={`${project.name} progress`} size="sm" />
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span className="tabular">
            {progress.done} of {progress.total} done
          </span>
          <span className="inline-flex items-center gap-2">
            {project.dueDate ? <span className={cn(overdue && 'text-error font-medium')}>Due {formatRelativeDate(project.dueDate)}</span> : null}
            {project.status !== PROJECT_STATUS.ACTIVE ? <Badge size="xs">{project.status === PROJECT_STATUS.ON_HOLD ? 'On hold' : project.status === PROJECT_STATUS.COMPLETED ? 'Completed' : 'Archived'}</Badge> : null}
          </span>
        </div>
      </Link>
      {actions ? <div className="absolute top-3 right-3">{actions}</div> : null}
    </article>
  )
}
