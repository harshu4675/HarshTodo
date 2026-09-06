import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '../lib/cn.js'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { Drawer } from '../components/ui/Drawer.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { MonthView } from '../components/calendar/MonthView.jsx'
import { TimeGridView } from '../components/calendar/TimeGridView.jsx'
import { AgendaView } from '../components/calendar/AgendaView.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { useUI } from '../app/UIContext.jsx'
import { useCalendarDrag } from '../hooks/useCalendarDrag.js'
import { useBreakpoint } from '../hooks/useMediaQuery.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { occurrencesInRange, groupOccurrencesByDate } from '../lib/calendar.js'
import { on, EVENTS } from '../lib/eventBus.js'
import { toDateKey, fromDateKey, todayKey, getMonthGrid, getWeekDays, format, addMonths, addWeeks, addDays, shiftDateKey, formatRelativeDate, isSameMonth } from '../lib/dates.js'

const VIEWS = [
  { id: 'month', label: 'Month', key: 'M' },
  { id: 'week', label: 'Week', key: 'W' },
  { id: 'day', label: 'Day', key: 'D' },
  { id: 'agenda', label: 'Agenda', key: null },
]

export default function CalendarPage() {
  useDocumentTitle('Calendar')
  const { tasks, settings } = useAppState()
  const { openTaskDetails, openTaskEditor } = useUI()
  const { isMobile } = useBreakpoint()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState(() => (VIEWS.some((v) => v.id === params.get('view')) ? params.get('view') : isMobile ? 'agenda' : 'month'))
  const [anchorKey, setAnchorKey] = useState(() => (fromDateKey(params.get('date')) ? params.get('date') : todayKey()))
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayPanelOpen, setDayPanelOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const drag = useCalendarDrag()
  const weekStartsOn = settings?.weekStartsOn ?? 1
  const anchor = fromDateKey(anchorKey) || new Date()

  useEffect(() => {
    const next = new URLSearchParams(params)
    next.set('view', view)
    next.set('date', anchorKey)
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [view, anchorKey, params, setParams])

  const range = useMemo(() => {
    if (view === 'month') {
      const grid = getMonthGrid(anchor, weekStartsOn)
      return { start: grid[0].key, end: grid[grid.length - 1].key }
    }
    if (view === 'week') {
      const days = getWeekDays(anchor, weekStartsOn)
      return { start: days[0].key, end: days[6].key }
    }
    if (view === 'day') return { start: anchorKey, end: anchorKey }
    return { start: anchorKey, end: shiftDateKey(anchorKey, 20) }
  }, [view, anchor, anchorKey, weekStartsOn])

  const byDate = useMemo(() => groupOccurrencesByDate(occurrencesInRange(tasks, range.start, range.end, { includeCompleted: showCompleted })), [tasks, range, showCompleted])

  const navigate = useCallback(
    (direction) => {
      if (direction === 'today') return setAnchorKey(todayKey())
      const delta = direction === 'next' ? 1 : -1
      if (view === 'month') setAnchorKey(toDateKey(addMonths(anchor, delta)))
      else if (view === 'week') setAnchorKey(toDateKey(addWeeks(anchor, delta)))
      else if (view === 'day') setAnchorKey(toDateKey(addDays(anchor, delta)))
      else setAnchorKey(toDateKey(addDays(anchor, delta * 21)))
    },
    [view, anchor],
  )

  useEffect(
    () =>
      on(EVENTS.CALENDAR_NAV, (cmd) => {
        if (cmd === 'prev' || cmd === 'next' || cmd === 'today') navigate(cmd)
        else if (VIEWS.some((v) => v.id === cmd)) setView(cmd)
      }),
    [navigate],
  )

  const addOn = useCallback((dateKey, timeKey) => openTaskEditor({ dueDate: dateKey, dueTime: timeKey || null }), [openTaskEditor])
  const selectDay = useCallback(
    (key, forceOpen = false) => {
      setSelectedDay(key)
      if (isMobile || forceOpen) setDayPanelOpen(true)
    },
    [isMobile],
  )

  const title = view === 'month' ? format(anchor, 'MMMM yyyy') : view === 'week' ? weekTitle(anchor, weekStartsOn) : view === 'day' ? format(anchor, 'EEEE, MMMM d') : `${format(anchor, 'MMM d')} to ${format(addDays(anchor, 20), 'MMM d')}`
  const selectedTasks = selectedDay ? (byDate.get(selectedDay) || []).map((o) => o.task).filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i) : []
  const isCurrent = view === 'month' ? isSameMonth(anchor, new Date()) : range.start <= todayKey() && range.end >= todayKey()

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-0">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="flex items-center gap-1">
          <IconButton icon="chevron-left" label="Previous" size="sm" onClick={() => navigate('prev')} />
          <IconButton icon="chevron-right" label="Next" size="sm" onClick={() => navigate('next')} />
          <Button size="sm" variant={isCurrent ? 'ghost' : 'secondary'} onClick={() => navigate('today')} className="ml-1">
            Today
          </Button>
        </div>
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-ink ml-1 min-w-0 truncate" aria-live="polite">
          {title}
        </h1>
        <div className="flex-1" />
        <button type="button" onClick={() => setShowCompleted((v) => !v)} aria-pressed={showCompleted} className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink px-2 h-8 rounded-md hover:bg-sunken">
          <span className={cn('h-3.5 w-3.5 rounded-xs border flex items-center justify-center', showCompleted ? 'bg-primary border-primary' : 'border-line-strong')}>{showCompleted ? <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5l2 2 4-4" fill="none" stroke="white" strokeWidth="1.5" /></svg> : null}</span>
          Show completed
        </button>
        <div role="tablist" aria-label="Calendar view" className="inline-flex rounded-md border border-line bg-surface p-0.5">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" type="button" aria-selected={view === v.id} onClick={() => setView(v.id)} className={cn('h-7 px-2.5 rounded-sm text-xs font-medium transition-colors', view === v.id ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-sunken')}>
              {v.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="primary" icon="plus" onClick={() => addOn(selectedDay || (isCurrent ? todayKey() : range.start))} className="hidden sm:inline-flex">
          Add
        </Button>
      </div>

      <div className={cn('flex-1 min-h-0 flex gap-4', view === 'month' && !isMobile && selectedDay ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_300px]' : '')}>
        <div className="flex-1 min-h-0 flex flex-col" style={{ minHeight: view === 'agenda' ? undefined : 'min(70vh, 720px)' }}>
          {view === 'month' ? <MonthView anchor={anchor} weekStartsOn={weekStartsOn} byDate={byDate} onOpenTask={openTaskDetails} onSelectDay={selectDay} onAddOn={addOn} drag={drag} selectedKey={selectedDay} /> : null}
          {view === 'week' || view === 'day' ? <TimeGridView anchor={anchor} weekStartsOn={weekStartsOn} byDate={byDate} mode={view} onOpenTask={openTaskDetails} onAddOn={addOn} drag={drag} dayStartHour={settings?.dayStartHour ?? 6} dayEndHour={settings?.dayEndHour ?? 22} /> : null}
          {view === 'agenda' ? <AgendaView startKey={range.start} endKey={range.end} byDate={byDate} onOpenTask={openTaskDetails} onAddOn={addOn} drag={drag} /> : null}
        </div>
        {view === 'month' && !isMobile && selectedDay ? (
          <aside className="hidden lg:flex flex-col min-h-0 border border-line rounded-lg bg-surface">
            <DayPanelContent dateKey={selectedDay} tasks={selectedTasks} onClose={() => setSelectedDay(null)} />
          </aside>
        ) : null}
      </div>

      {isMobile || view !== 'month' ? (
        <Drawer open={dayPanelOpen && Boolean(selectedDay)} onClose={() => setDayPanelOpen(false)} title={selectedDay ? formatRelativeDate(selectedDay) : ''} hideHeader>
          {selectedDay ? <DayPanelContent dateKey={selectedDay} tasks={selectedTasks} onClose={() => setDayPanelOpen(false)} /> : null}
        </Drawer>
      ) : null}
    </div>
  )
}

function DayPanelContent({ dateKey, tasks, onClose }) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between px-4 h-12 border-b border-line shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-ink">{formatRelativeDate(dateKey)}</h2>
          <p className="text-xs text-ink-muted">{format(fromDateKey(dateKey), 'EEEE, MMMM d')}</p>
        </div>
        <IconButton icon="x" label="Close day panel" size="sm" onClick={onClose} />
      </div>
      <div className="p-3 flex flex-col gap-3 overflow-y-auto scrollbar-thin flex-1">
        <QuickAdd compact defaults={{ dueDate: dateKey }} placeholder="Add a task for this day" />
        <TaskList tasks={tasks} bulkEnabled={false} compact ariaLabel={`Tasks on ${dateKey}`} emptyState={<EmptyState compact icon="calendar" title="Nothing on this day" description="Drag a task here or add one above." />} />
      </div>
    </div>
  )
}

function weekTitle(anchor, weekStartsOn) {
  const days = getWeekDays(anchor, weekStartsOn)
  const a = days[0].date
  const b = days[6].date
  if (a.getMonth() === b.getMonth()) return `${format(a, 'MMM d')} to ${format(b, 'd, yyyy')}`
  if (a.getFullYear() === b.getFullYear()) return `${format(a, 'MMM d')} to ${format(b, 'MMM d, yyyy')}`
  return `${format(a, 'MMM d, yyyy')} to ${format(b, 'MMM d, yyyy')}`
}
