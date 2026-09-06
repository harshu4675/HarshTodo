import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { Icon } from '../ui/Icon.jsx'
import { Button, IconButton } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { parseTaskInput } from '../../lib/naturalLanguage.js'
import { describeRecurrence } from '../../data/recurrence.js'
import { formatRelativeDate, formatTimeKey, formatDuration } from '../../lib/dates.js'
import { PRIORITY_BY_VALUE } from '../../constants/task.js'
import { useAppActions, useAppState } from '../../store/AppStore.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { on, EVENTS } from '../../lib/eventBus.js'

export function QuickAdd({ defaults = {}, placeholder = 'Add a task, for example "Call Rahul tomorrow at 5pm"', className, autoFocus = false, onCreated, compact = false }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(() => new Set())
  const inputRef = useRef(null)
  const actions = useAppActions()
  const { projects } = useAppState()
  const { openTaskEditor } = useUI()
  const toast = useToast()

  const parsed = useMemo(() => (value.trim() ? parseTaskInput(value) : null), [value])

  useEffect(() => on(EVENTS.QUICK_ADD_FOCUS, () => inputRef.current?.focus()), [])
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    setDismissed(new Set())
  }, [value])

  function buildInput() {
    if (!parsed) return null
    const matchedProject = parsed.projectName ? projects.find((p) => p.name.toLowerCase() === parsed.projectName.toLowerCase()) : null
    return {
      title: parsed.title,
      dueDate: dismissed.has('date') ? defaults.dueDate ?? null : parsed.dueDate ?? defaults.dueDate ?? null,
      dueTime: dismissed.has('date') || dismissed.has('time') ? null : parsed.dueTime,
      recurrence: dismissed.has('recurrence') ? null : parsed.recurrence,
      priority: dismissed.has('priority') ? defaults.priority ?? 0 : parsed.priority ?? defaults.priority ?? 0,
      estimatedMinutes: dismissed.has('duration') ? null : parsed.estimatedMinutes,
      projectId: matchedProject?.id ?? defaults.projectId ?? null,
      listId: defaults.listId ?? null,
      tagIds: defaults.tagIds ?? [],
      tagNames: parsed.tagNames,
      status: defaults.status,
    }
  }

  async function submit() {
    const input = buildInput()
    if (!input || !input.title) return
    setBusy(true)
    try {
      const { tagNames, ...rest } = input
      const tagIds = tagNames.length ? await actions.ensureTagsByName(tagNames) : []
      const task = await actions.addTask({ ...rest, tagIds: Array.from(new Set([...(rest.tagIds || []), ...tagIds])) })
      setValue('')
      onCreated?.(task)
      inputRef.current?.focus()
    } catch (error) {
      toast.error('Could not save the task', { description: error.message })
    } finally {
      setBusy(false)
    }
  }

  function openFull() {
    const input = buildInput()
    const { tagNames, ...rest } = input || {}
    openTaskEditor({ ...defaults, ...rest, title: input?.title || value })
    setValue('')
  }

  const chips = []
  if (parsed?.dueDate && !dismissed.has('date')) {
    chips.push({ key: 'date', icon: 'calendar', label: `${formatRelativeDate(parsed.dueDate)}${parsed.dueTime && !dismissed.has('time') ? `, ${formatTimeKey(parsed.dueTime)}` : ''}` })
  }
  if (parsed?.recurrence && !dismissed.has('recurrence')) chips.push({ key: 'recurrence', icon: 'repeat', label: describeRecurrence(parsed.recurrence) })
  if (parsed?.priority !== null && parsed?.priority !== undefined && !dismissed.has('priority')) chips.push({ key: 'priority', icon: 'flag', label: PRIORITY_BY_VALUE[parsed.priority].label })
  if (parsed?.estimatedMinutes && !dismissed.has('duration')) chips.push({ key: 'duration', icon: 'clock', label: formatDuration(parsed.estimatedMinutes) })
  parsed?.tagNames.forEach((t) => chips.push({ key: `tag-${t}`, icon: 'tag', label: t, fixed: true }))
  if (parsed?.projectName) chips.push({ key: 'project', icon: 'folder', label: parsed.projectName, fixed: true })

  return (
    <div className={cn('flex flex-col', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-surface transition-colors duration-fast',
          'border-line hover:border-line-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15',
          compact ? 'px-2.5 h-10' : 'px-3 h-11 sm:h-12',
        )}
      >
        <Icon name="plus" size={18} className="text-ink-muted shrink-0" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setValue('')
              e.currentTarget.blur()
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              openFull()
            }
          }}
          placeholder={placeholder}
          aria-label="Quick add task"
          autoComplete="off"
          enterKeyHint="done"
          className="flex-1 min-w-0 bg-transparent text-sm sm:text-[15px] text-ink outline-none placeholder:text-ink-faint"
        />
        {value ? (
          <>
            <IconButton icon="maximize" label="Open full editor" size="sm" onClick={openFull} className="hidden sm:inline-flex" />
            <Button type="submit" size="sm" variant="primary" loading={busy} disabled={!parsed?.title}>
              Add
            </Button>
          </>
        ) : null}
      </form>
      {chips.length ? (
        <div className="flex items-center gap-1.5 flex-wrap mt-2 px-1" aria-live="polite">
          <span className="text-[11px] text-ink-muted mr-0.5">Detected</span>
          {chips.map((chip) => (
            <span key={chip.key} className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-sm bg-primary-soft text-primary text-xs font-medium">
              <Icon name={chip.icon} size={12} />
              {chip.label}
              {!chip.fixed ? (
                <button
                  type="button"
                  aria-label={`Ignore detected ${chip.key}`}
                  onClick={() => setDismissed((s) => new Set(s).add(chip.key))}
                  className="ml-0.5 rounded-xs p-0.5 hover:bg-primary/10"
                >
                  <Icon name="x" size={11} strokeWidth={2.5} />
                </button>
              ) : (
                <span className="w-1" />
              )}
            </span>
          ))}
          <Badge tone="neutral" size="xs" className="ml-auto hidden sm:inline-flex">
            Ctrl+Enter for details
          </Badge>
        </div>
      ) : null}
    </div>
  )
}
