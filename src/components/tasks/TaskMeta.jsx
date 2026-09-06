import { Icon } from '../ui/Icon.jsx'
import { TagChip, ColorDot } from '../ui/Badge.jsx'
import { cn } from '../../lib/cn.js'
import { formatRelativeDate, formatTimeKey, formatDuration } from '../../lib/dates.js'
import { isTaskOverdue, subtaskProgress } from '../../lib/taskQueries.js'
import { useTaskLookups } from '../../hooks/useTaskLookups.js'

export function TaskMeta({ task, compact = false, showProject = true, className, now }) {
  const { projectById, tagById } = useTaskLookups()
  const overdue = isTaskOverdue(task, now)
  const project = task.projectId ? projectById.get(task.projectId) : null
  const progress = subtaskProgress(task)
  const tags = task.tagIds.map((id) => tagById.get(id)).filter(Boolean)
  const items = []
  if (task.dueDate) {
    items.push(
      <span key="date" className={cn('inline-flex items-center gap-1', overdue ? 'text-error font-medium' : task.dueDate === formatRelativeDate(task.dueDate) ? '' : '')}>
        <Icon name={overdue ? 'alert-circle' : 'calendar'} size={12} />
        {formatRelativeDate(task.dueDate, now)}
        {task.dueTime ? `, ${formatTimeKey(task.dueTime)}` : ''}
      </span>,
    )
  }
  if (task.recurrence) items.push(<Icon key="rec" name="repeat" size={12} aria-label="Repeats" />)
  if (task.reminderMinutesBefore !== null && task.dueTime) items.push(<Icon key="bell" name="bell" size={12} aria-label="Reminder set" />)
  if (task.estimatedMinutes) {
    items.push(
      <span key="est" className="inline-flex items-center gap-1">
        <Icon name="clock" size={12} />
        {formatDuration(task.estimatedMinutes)}
      </span>,
    )
  }
  if (progress) {
    items.push(
      <span key="sub" className="inline-flex items-center gap-1 tabular">
        <Icon name="list-todo" size={12} />
        {progress.done}/{progress.total}
      </span>,
    )
  }
  if (task.attachments.length) {
    items.push(
      <span key="att" className="inline-flex items-center gap-1 tabular">
        <Icon name="paperclip" size={12} />
        {task.attachments.length}
      </span>,
    )
  }
  if (task.description || task.notes) items.push(<Icon key="desc" name="align-left" size={12} aria-label="Has description" />)
  if (showProject && project) {
    items.push(
      <span key="proj" className="inline-flex items-center gap-1.5 truncate max-w-[10rem]">
        <ColorDot color={project.color} size={6} />
        <span className="truncate">{project.name}</span>
      </span>,
    )
  }
  if (!items.length && !tags.length) return null
  return (
    <div className={cn('flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-ink-muted', className)}>
      {items}
      {!compact && tags.length ? (
        <span className="inline-flex items-center gap-1 flex-wrap">
          {tags.slice(0, 3).map((t) => (
            <TagChip key={t.id} tag={t} size="xs" />
          ))}
          {tags.length > 3 ? <span className="text-[11px]">+{tags.length - 3}</span> : null}
        </span>
      ) : null}
    </div>
  )
}
