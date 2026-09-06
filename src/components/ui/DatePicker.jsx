import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/cn.js'
import { getMonthGrid, fromDateKey, toDateKey, todayKey, shiftDateKey, format, addMonths, startOfMonth, formatRelativeDate, formatTimeKey } from '../../lib/dates.js'
import { WEEKDAYS } from '../../constants/task.js'
import { IconButton, Button } from './Button.jsx'
import { Dropdown } from './Dropdown.jsx'
import { Icon } from './Icon.jsx'
import { useAppState } from '../../store/AppStore.jsx'

export function CalendarGrid({ value, onChange, weekStartsOn = 1, minDate, className, markers }) {
  const initial = fromDateKey(value) || new Date()
  const [month, setMonth] = useState(startOfMonth(initial))
  const [focused, setFocused] = useState(value || todayKey())
  const gridRef = useRef(null)
  const days = getMonthGrid(month, weekStartsOn)
  const today = todayKey()
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(weekStartsOn + i) % 7])

  useEffect(() => {
    const d = fromDateKey(value)
    if (d) setMonth(startOfMonth(d))
  }, [value])

  function moveFocus(nextKey) {
    setFocused(nextKey)
    const d = fromDateKey(nextKey)
    if (d && (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear())) setMonth(startOfMonth(d))
    requestAnimationFrame(() => gridRef.current?.querySelector(`[data-key="${nextKey}"]`)?.focus())
  }

  function onKeyDown(event) {
    const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (map[event.key] !== undefined) {
      event.preventDefault()
      moveFocus(shiftDateKey(focused, map[event.key]))
    } else if (event.key === 'PageUp') {
      event.preventDefault()
      moveFocus(shiftDateKey(focused, -1, 'month'))
    } else if (event.key === 'PageDown') {
      event.preventDefault()
      moveFocus(shiftDateKey(focused, 1, 'month'))
    } else if (event.key === 'Home') {
      event.preventDefault()
      moveFocus(toDateKey(startOfMonth(fromDateKey(focused))))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onChange(focused)
    }
  }

  return (
    <div className={cn('select-none', className)}>
      <div className="flex items-center justify-between mb-2">
        <IconButton icon="chevron-left" label="Previous month" size="sm" onClick={() => setMonth((m) => addMonths(m, -1))} />
        <span className="text-sm font-semibold text-ink" aria-live="polite">
          {format(month, 'MMMM yyyy')}
        </span>
        <IconButton icon="chevron-right" label="Next month" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))} />
      </div>
      <div role="grid" ref={gridRef} onKeyDown={onKeyDown} aria-label="Calendar" className="grid grid-cols-7 gap-y-0.5">
        {headers.map((h) => (
          <div key={h.value} role="columnheader" className="h-7 text-center text-[11px] font-medium text-ink-muted uppercase" aria-label={h.label}>
            {h.letter}
          </div>
        ))}
        {days.map(({ key, date, inMonth }) => {
          const selected = key === value
          const isToday = key === today
          const disabled = minDate ? key < minDate : false
          const hasMarker = markers?.has(key)
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              data-key={key}
              tabIndex={key === focused ? 0 : -1}
              aria-selected={selected}
              aria-label={format(date, 'EEEE, MMMM d, yyyy')}
              disabled={disabled}
              onClick={() => onChange(key)}
              onFocus={() => setFocused(key)}
              className={cn(
                'relative h-9 w-full rounded-md text-sm tabular transition-colors duration-fast outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/40',
                !inMonth && 'text-ink-faint',
                inMonth && !selected && 'text-ink hover:bg-sunken',
                isToday && !selected && 'font-semibold text-primary',
                selected && 'bg-primary text-white font-semibold',
                disabled && 'opacity-40 pointer-events-none',
              )}
            >
              {date.getDate()}
              {hasMarker && !selected ? <span aria-hidden="true" className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const QUICK_DATES = [
  { label: 'Today', icon: 'sun', get: () => todayKey() },
  { label: 'Tomorrow', icon: 'arrow-right', get: () => shiftDateKey(todayKey(), 1) },
  { label: 'Next week', icon: 'calendar-days', get: () => shiftDateKey(todayKey(), 7) },
  { label: 'No date', icon: 'circle-slash', get: () => null },
]

export function DatePickerPanel({ date, time, onChange, showTime = true, onDone }) {
  const { settings } = useAppState()
  return (
    <div className="p-2 w-full sm:w-[290px]">
      <div className="grid grid-cols-2 gap-1 mb-2">
        {QUICK_DATES.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => {
              onChange({ date: q.get(), time: q.get() ? time : null })
              if (!q.get()) onDone?.()
            }}
            className="flex items-center gap-2 rounded-md px-2 h-8 text-sm text-ink hover:bg-sunken transition-colors duration-fast"
          >
            <Icon name={q.icon} size={14} className="text-ink-muted" />
            {q.label}
          </button>
        ))}
      </div>
      <CalendarGrid value={date} onChange={(next) => onChange({ date: next, time })} weekStartsOn={settings?.weekStartsOn ?? 1} />
      {showTime ? (
        <div className="mt-2 pt-2 border-t border-line flex items-center gap-2">
          <Icon name="clock" size={14} className="text-ink-muted" />
          <input
            type="time"
            value={time || ''}
            aria-label="Time"
            onChange={(e) => onChange({ date: date || todayKey(), time: e.target.value || null })}
            className="h-8 flex-1 rounded-md border border-line-strong bg-surface px-2 text-sm focus:border-primary focus:outline-none"
          />
          {time ? <IconButton icon="x" label="Clear time" size="xs" onClick={() => onChange({ date, time: null })} /> : null}
        </div>
      ) : null}
      {onDone ? (
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="primary" onClick={onDone}>
            Done
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function DatePickerButton({ date, time, onChange, showTime = true, size = 'sm', variant = 'secondary', placeholder = 'Date', className, overdue = false }) {
  const label = date ? `${formatRelativeDate(date)}${time ? `, ${formatTimeKey(time)}` : ''}` : placeholder
  return (
    <Dropdown
      width="w-auto"
      title="Schedule"
      trigger={({ toggle, props }) => (
        <Button
          size={size}
          variant={variant}
          icon="calendar"
          onClick={toggle}
          className={cn(date && 'text-ink', !date && 'text-ink-muted', overdue && 'text-error border-error/40', className)}
          {...props}
        >
          {label}
        </Button>
      )}
    >
      {({ close }) => <DatePickerPanel date={date} time={time} onChange={onChange} showTime={showTime} onDone={close} />}
    </Dropdown>
  )
}
