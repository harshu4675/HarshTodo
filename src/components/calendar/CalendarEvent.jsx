import { memo } from 'react'
import { cn } from '../../lib/cn.js'
import { Icon } from '../ui/Icon.jsx'
import { COLOR_BY_ID, TASK_STATUS, PRIORITY_BY_VALUE } from '../../constants/task.js'
import { formatTimeKey } from '../../lib/dates.js'
import { useTaskLookups } from '../../hooks/useTaskLookups.js'

export const CalendarEvent = memo(function CalendarEvent({ occurrence, onOpen, onDragStart, onDragEnd, variant = 'chip', style, className, overdue = false }) {
  const { task } = occurrence
  const { projectById } = useTaskLookups()
  const completed = task.status === TASK_STATUS.COMPLETED
  const project = task.projectId ? projectById.get(task.projectId) : null
  const colorId = task.color || project?.color || null
  const hex = colorId ? COLOR_BY_ID[colorId]?.hex : null
  const priorityToken = PRIORITY_BY_VALUE[task.priority]?.token
  const accent = hex || (task.priority > 0 ? `var(--color-priority-${priorityToken})` : 'var(--color-primary)')
  const draggable = !completed && !occurrence.span

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={draggable ? (e) => onDragStart?.(e, occurrence) : undefined}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(task.id)
      }}
      style={style}
      aria-label={`${task.title}${occurrence.timeKey ? `, ${formatTimeKey(occurrence.timeKey)}` : ''}${completed ? ', completed' : ''}`}
      className={cn(
        'group/event text-left w-full rounded-sm border outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors',
        variant === 'chip' && 'flex items-center gap-1.5 h-6 px-1.5 text-xs',
        variant === 'block' && 'absolute flex flex-col overflow-hidden px-1.5 py-1 text-xs leading-tight shadow-xs',
        variant === 'row' && 'flex items-center gap-2 px-2 py-1.5 text-sm',
        completed ? 'bg-sunken border-line text-ink-muted' : 'bg-surface border-line hover:border-line-strong text-ink',
        overdue && !completed && 'border-error/40',
        draggable && 'cursor-grab active:cursor-grabbing',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('shrink-0 rounded-full', variant === 'block' ? 'absolute left-0 top-0 bottom-0 w-1 rounded-none rounded-l-sm' : 'h-2 w-2')} style={{ backgroundColor: completed ? 'var(--color-ink-faint)' : accent }} />
      <span className={cn('truncate', variant === 'block' && 'pl-1.5 font-medium', completed && 'line-through')}>
        {variant !== 'block' && occurrence.timeKey ? <span className="tabular text-ink-muted mr-1">{formatTimeKey(occurrence.timeKey)}</span> : null}
        {task.title}
      </span>
      {variant === 'block' && occurrence.timeKey ? <span className="pl-1.5 tabular text-ink-muted">{formatTimeKey(occurrence.timeKey)}</span> : null}
      {task.recurrence && variant !== 'block' ? <Icon name="repeat" size={10} className="ml-auto shrink-0 text-ink-faint" /> : null}
    </button>
  )
})
