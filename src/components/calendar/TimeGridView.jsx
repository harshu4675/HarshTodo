import { useEffect, useMemo, useRef } from 'react'
import { cn } from '../../lib/cn.js'
import { CalendarEvent } from './CalendarEvent.jsx'
import { layoutTimedOccurrences, snapMinutes } from '../../lib/calendar.js'
import { getWeekDays, todayKey, format, minutesToTimeKey } from '../../lib/dates.js'
import { useNow } from '../../hooks/useNow.js'
import { isTaskOverdue } from '../../lib/taskQueries.js'

const HOUR_HEIGHT = 56
const SNAP = 15

export function TimeGridView({ anchor, weekStartsOn, byDate, mode = 'week', onOpenTask, onAddOn, drag, dayStartHour, dayEndHour }) {
  const now = useNow(60000)
  const days = useMemo(() => (mode === 'week' ? getWeekDays(anchor, weekStartsOn) : [{ date: anchor, key: todayKey(anchor) }]), [anchor, weekStartsOn, mode])
  const scrollRef = useRef(null)
  const today = todayKey(now)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const totalHeight = HOUR_HEIGHT * 24

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const target = days.some((d) => d.key === today) ? Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT) : dayStartHour * HOUR_HEIGHT
    el.scrollTop = target
  }, [days, dayStartHour, today])

  function minutesFromEvent(e, container) {
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top + container.scrollTop
    return snapMinutes((y / HOUR_HEIGHT) * 60, SNAP)
  }

  const nowOffset = (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60)

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-line rounded-lg bg-surface overflow-hidden">
      <div className="grid border-b border-line bg-canvas" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map(({ date, key }) => {
          const isToday = key === today
          const allDay = (byDate.get(key) || []).filter((o) => o.allDay)
          return (
            <div key={key} className="flex flex-col border-l border-line min-w-0">
              <button type="button" onClick={() => onAddOn(key)} className="h-12 flex flex-col items-center justify-center gap-0 hover:bg-sunken transition-colors" aria-label={`Add task on ${format(date, 'EEEE, MMMM d')}`}>
                <span className="text-[11px] uppercase tracking-wide text-ink-muted">{format(date, 'EEE')}</span>
                <span className={cn('inline-flex items-center justify-center h-6 min-w-6 px-1 rounded-full text-sm tabular font-medium', isToday ? 'bg-primary text-white' : 'text-ink')}>{date.getDate()}</span>
              </button>
              <div
                className={cn('flex flex-col gap-0.5 px-1 py-1 min-h-8 border-t border-line/60 max-h-24 overflow-y-auto scrollbar-none', drag.isOver(key, null) && 'drop-target')}
                {...drag.dropTargetProps(key, null)}
                aria-label={`All-day tasks for ${format(date, 'MMMM d')}`}
              >
                {allDay.map((occ) => (
                  <CalendarEvent key={occ.id} occurrence={occ} onOpen={onOpenTask} onDragStart={drag.onDragStart} onDragEnd={drag.onDragEnd} overdue={isTaskOverdue(occ.task, now) && occ.dateKey === occ.task.dueDate} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin relative">
        <div className="grid relative" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))`, height: totalHeight }}>
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] tabular text-ink-muted" style={{ top: h * HOUR_HEIGHT }}>
                {h === 0 ? '' : format(new Date(2000, 0, 1, h), 'h a')}
              </div>
            ))}
          </div>
          {days.map(({ date, key }) => {
            const timed = layoutTimedOccurrences(byDate.get(key) || [])
            const isToday = key === today
            return (
              <div
                key={key}
                className="relative border-l border-line"
                onDoubleClick={(e) => {
                  const minutes = minutesFromEvent(e, scrollRef.current)
                  onAddOn(key, minutesToTimeKey(minutes))
                }}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes('text/task-id')) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const minutes = minutesFromEvent(e, scrollRef.current)
                  drag.dropTargetProps(key, minutesToTimeKey(minutes)).onDrop(e)
                }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    aria-hidden="true"
                    className={cn('absolute inset-x-0 border-t border-line/70', (h < dayStartHour || h >= dayEndHour) && 'bg-canvas/50')}
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}
                {hours.map((h) => (
                  <button
                    key={`add-${h}`}
                    type="button"
                    tabIndex={-1}
                    aria-label={`Add task at ${format(new Date(2000, 0, 1, h), 'h a')} on ${format(date, 'MMMM d')}`}
                    onClick={(e) => {
                      const minutes = minutesFromEvent(e, scrollRef.current)
                      onAddOn(key, minutesToTimeKey(minutes))
                    }}
                    className="absolute inset-x-0 opacity-0 hover:opacity-100 focus-visible:opacity-100 text-[10px] text-primary flex items-end justify-end pr-1 pb-0.5"
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  >
                    Add
                  </button>
                ))}
                {isToday ? (
                  <div aria-hidden="true" className="absolute inset-x-0 z-10 pointer-events-none flex items-center" style={{ top: nowOffset }}>
                    <span className="h-2 w-2 rounded-full bg-error -ml-1" />
                    <span className="flex-1 h-px bg-error" />
                  </div>
                ) : null}
                {timed.map(({ occ, start, end, column, columns }) => {
                  const width = 100 / columns
                  return (
                    <CalendarEvent
                      key={occ.id}
                      occurrence={occ}
                      variant="block"
                      onOpen={onOpenTask}
                      onDragStart={drag.onDragStart}
                      onDragEnd={drag.onDragEnd}
                      overdue={isTaskOverdue(occ.task, now) && occ.dateKey === occ.task.dueDate}
                      style={{
                        top: start * (HOUR_HEIGHT / 60) + 1,
                        height: Math.max(22, (end - start) * (HOUR_HEIGHT / 60) - 2),
                        left: `calc(${column * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
