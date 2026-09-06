import { useState } from 'react'
import { cn } from '../../lib/cn.js'
import { Select, Input, Field } from '../ui/Input.jsx'
import { RECURRENCE_PRESETS, describeRecurrence, normalizeRecurrence, validateRecurrence } from '../../data/recurrence.js'
import { WEEKDAYS, RECURRENCE_FREQUENCY } from '../../constants/task.js'

function presetFor(rule) {
  if (!rule) return 'none'
  const normalized = normalizeRecurrence(rule)
  for (const preset of RECURRENCE_PRESETS) {
    if (!preset.rule) continue
    const candidate = normalizeRecurrence(preset.rule)
    if (JSON.stringify(candidate) === JSON.stringify(normalized)) return preset.id
  }
  return 'custom'
}

export function RecurrenceEditor({ value, onChange, anchorDate }) {
  const [custom, setCustom] = useState(() => presetFor(value) === 'custom')
  const preset = custom ? 'custom' : presetFor(value)
  const rule = normalizeRecurrence(value) || { frequency: RECURRENCE_FREQUENCY.WEEKLY, interval: 1, weekdays: [], monthDays: [], count: null, until: null }
  const validation = value ? validateRecurrence(value) : { valid: true }
  const ends = rule.until ? 'until' : rule.count ? 'count' : 'never'

  function update(patch) {
    onChange(normalizeRecurrence({ ...rule, ...patch }))
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={preset}
        aria-label="Repeat"
        onChange={(e) => {
          const id = e.target.value
          if (id === 'custom') {
            setCustom(true)
            if (!value) onChange(normalizeRecurrence({ frequency: RECURRENCE_FREQUENCY.WEEKLY, interval: 1 }))
            return
          }
          setCustom(false)
          const p = RECURRENCE_PRESETS.find((x) => x.id === id)
          onChange(p?.rule ? normalizeRecurrence(p.rule) : null)
        }}
      >
        {RECURRENCE_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </Select>
      {custom ? (
        <div className="rounded-md border border-line bg-canvas p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-secondary">Every</span>
            <Input type="number" min={1} max={999} value={rule.interval} onChange={(e) => update({ interval: Math.max(1, Number(e.target.value) || 1) })} className="w-20" size="sm" aria-label="Interval" />
            <Select value={rule.frequency} size="sm" aria-label="Frequency" onChange={(e) => update({ frequency: e.target.value, weekdays: [], monthDays: [] })} className="w-32">
              <option value={RECURRENCE_FREQUENCY.DAILY}>{rule.interval === 1 ? 'day' : 'days'}</option>
              <option value={RECURRENCE_FREQUENCY.WEEKLY}>{rule.interval === 1 ? 'week' : 'weeks'}</option>
              <option value={RECURRENCE_FREQUENCY.MONTHLY}>{rule.interval === 1 ? 'month' : 'months'}</option>
              <option value={RECURRENCE_FREQUENCY.YEARLY}>{rule.interval === 1 ? 'year' : 'years'}</option>
            </Select>
          </div>
          {rule.frequency === RECURRENCE_FREQUENCY.WEEKLY ? (
            <div className="flex items-center gap-1" role="group" aria-label="Repeat on weekdays">
              {WEEKDAYS.map((d) => {
                const active = rule.weekdays.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={active}
                    aria-label={d.label}
                    onClick={() => update({ weekdays: active ? rule.weekdays.filter((x) => x !== d.value) : [...rule.weekdays, d.value] })}
                    className={cn('h-8 w-8 rounded-full text-xs font-medium border transition-colors', active ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-secondary border-line-strong hover:bg-sunken')}
                  >
                    {d.letter}
                  </button>
                )
              })}
            </div>
          ) : null}
          {rule.frequency === RECURRENCE_FREQUENCY.MONTHLY ? (
            <div className="grid grid-cols-7 gap-1" role="group" aria-label="Repeat on days of month">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const active = rule.monthDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ monthDays: active ? rule.monthDays.filter((x) => x !== day) : [...rule.monthDays, day] })}
                    className={cn('h-8 rounded-md text-xs tabular border transition-colors', active ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-secondary border-line hover:bg-sunken')}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          ) : null}
          <Field label="Ends">
            <div className="flex flex-col gap-2">
              <Select size="sm" value={ends} aria-label="Ends" onChange={(e) => update({ until: e.target.value === 'until' ? anchorDate || null : null, count: e.target.value === 'count' ? 10 : null })}>
                <option value="never">Never</option>
                <option value="until">On a date</option>
                <option value="count">After a number of times</option>
              </Select>
              {ends === 'until' ? <Input type="date" size="sm" value={rule.until || ''} min={anchorDate || undefined} aria-label="End date" onChange={(e) => update({ until: e.target.value || null })} /> : null}
              {ends === 'count' ? <Input type="number" size="sm" min={1} max={10000} value={rule.count || 1} aria-label="Number of occurrences" onChange={(e) => update({ count: Math.max(1, Number(e.target.value) || 1) })} /> : null}
            </div>
          </Field>
        </div>
      ) : null}
      {value ? <p className={cn('text-xs', validation.valid ? 'text-ink-muted' : 'text-error')}>{validation.valid ? describeRecurrence(value) : validation.reason}</p> : null}
    </div>
  )
}
