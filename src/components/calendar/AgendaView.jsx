import { useMemo } from 'react'
import { cn } from '../../lib/cn.js'
import { CalendarEvent } from './CalendarEvent.jsx'
import { EmptyState } from '../ui/States.jsx'
import { Button } from '../ui/Button.jsx'
import { dateKeysInRange, formatDateKey, formatRelativeDate, todayKey } from '../../lib/dates.js'
import { isTaskOverdue } from '../../lib/taskQueries.js'

export function AgendaView({ startKey, endKey, byDate, onOpenTask, onAddOn, drag }) {
  const keys = useMemo(() => dateKeysInRange(startKey, endKey), [startKey, endKey])
  const today = todayKey()
  const now = new Date()
  const populated = keys.filter((k) => (byDate.get(k) || []).length)
  if (!populated.length) {
    return (
      <div className="flex-1 border border-line rounded-lg bg-surface">
        <EmptyState icon="calendar-range" title="Nothing scheduled in this range" description="Tasks with a due date or start date will be listed here day by day." action={{ label: 'Add a task', icon: 'plus', onClick: () => onAddOn(today >= startKey && today <= endKey ? today : startKey) }} />
      </div>
    )
  }
  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin border border-line rounded-lg bg-surface">
      {populated.map((key) => {
        const items = byDate.get(key)
        const isToday = key === today
        return (
          <section key={key} aria-labelledby={`agenda-${key}`} className={cn('grid grid-cols-[5.5rem_1fr] sm:grid-cols-[8rem_1fr] border-b border-line last:border-b-0', drag.isOver(key) && 'drop-target')} {...drag.dropTargetProps(key)}>
            <div className="px-3 py-3 border-r border-line/60">
              <h3 id={`agenda-${key}`} className={cn('text-sm font-semibold', isToday ? 'text-primary' : 'text-ink')}>
                {formatRelativeDate(key)}
              </h3>
              <p className="text-xs text-ink-muted">{formatDateKey(key, 'EEE, MMM d')}</p>
              <Button size="xs" variant="ghost" icon="plus" className="mt-1 -ml-2" onClick={() => onAddOn(key)}>
                Add
              </Button>
            </div>
            <ul className="flex flex-col gap-1 p-2">
              {items.map((occ) => (
                <li key={occ.id}>
                  <CalendarEvent occurrence={occ} variant="row" onOpen={onOpenTask} onDragStart={drag.onDragStart} onDragEnd={drag.onDragEnd} overdue={isTaskOverdue(occ.task, now) && occ.dateKey === occ.task.dueDate} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
