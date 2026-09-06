import { useMemo } from 'react'
import { cn } from '../../lib/cn.js'
import { CalendarEvent } from './CalendarEvent.jsx'
import { getMonthGrid, todayKey, format } from '../../lib/dates.js'
import { WEEKDAYS } from '../../constants/task.js'
import { isTaskOverdue } from '../../lib/taskQueries.js'

export function MonthView({ anchor, weekStartsOn, byDate, onOpenTask, onSelectDay, onAddOn, drag, selectedKey }) {
  const days = useMemo(() => getMonthGrid(anchor, weekStartsOn), [anchor, weekStartsOn])
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(weekStartsOn + i) % 7])
  const today = todayKey()
  const now = new Date()
  return (
    <div className="flex flex-col flex-1 min-h-0 border border-line rounded-lg bg-surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line bg-canvas" role="row">
        {headers.map((h) => (
          <div key={h.value} role="columnheader" className="h-8 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            <span className="sm:hidden">{h.letter}</span>
            <span className="hidden sm:inline">{h.short}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0 auto-rows-fr" role="grid" aria-label={format(anchor, 'MMMM yyyy')}>
        {days.map(({ key, date, inMonth }, i) => {
          const items = byDate.get(key) || []
          const max = 3
          const overflow = items.length - max
          const isToday = key === today
          const isSelected = key === selectedKey
          const over = drag.isOver(key)
          return (
            <div
              key={key}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${format(date, 'EEEE, MMMM d')}, ${items.length} ${items.length === 1 ? 'task' : 'tasks'}`}
              tabIndex={isSelected || (!selectedKey && isToday) ? 0 : -1}
              data-key={key}
              onClick={() => onSelectDay(key)}
              onDoubleClick={() => onAddOn(key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAddOn(key)
              }}
              {...drag.dropTargetProps(key)}
              className={cn(
                'relative flex flex-col gap-0.5 min-h-[4.5rem] sm:min-h-[6rem] p-1 sm:p-1.5 border-b border-r border-line text-left outline-none transition-colors',
                i % 7 === 6 && 'border-r-0',
                i >= 35 && 'border-b-0',
                !inMonth && 'bg-canvas/60',
                isSelected && 'bg-primary-soft/40',
                over && 'drop-target',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 cursor-pointer',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('inline-flex items-center justify-center h-6 min-w-6 px-1 rounded-full text-xs tabular', isToday ? 'bg-primary text-white font-semibold' : inMonth ? 'text-ink' : 'text-ink-faint')}>
                  {date.getDate()}
                </span>
                {items.length ? <span className="sm:hidden text-[10px] text-ink-muted tabular">{items.length}</span> : null}
              </div>
              <div className="hidden sm:flex flex-col gap-0.5 min-h-0">
                {items.slice(0, max).map((occ) => (
                  <CalendarEvent key={occ.id} occurrence={occ} onOpen={onOpenTask} onDragStart={drag.onDragStart} onDragEnd={drag.onDragEnd} overdue={isTaskOverdue(occ.task, now) && occ.dateKey === occ.task.dueDate} />
                ))}
                {overflow > 0 ? (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onSelectDay(key, true) }} className="text-[11px] text-ink-muted hover:text-ink text-left px-1">
                    +{overflow} more
                  </button>
                ) : null}
              </div>
              <div className="sm:hidden flex items-center gap-0.5 flex-wrap mt-auto">
                {items.slice(0, 4).map((occ) => (
                  <span key={occ.id} aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', occ.task.status === 'completed' ? 'bg-ink-faint' : 'bg-primary')} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
