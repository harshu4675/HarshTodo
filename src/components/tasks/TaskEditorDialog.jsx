import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { Input, Textarea, Select, Field } from '../ui/Input.jsx'
import { DatePickerButton } from '../ui/DatePicker.jsx'
import { RecurrenceEditor } from './RecurrenceEditor.jsx'
import { TagPicker } from './TagPicker.jsx'
import { Icon } from '../ui/Icon.jsx'
import { useAppActions, useAppState } from '../../store/AppStore.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { PRIORITY_LIST, TASK_STATUS_LIST, TASK_STATUS, REMINDER_OFFSETS, DURATION_PRESETS, COLOR_SWATCHES, PROJECT_STATUS } from '../../constants/task.js'
import { parseTaskInput } from '../../lib/naturalLanguage.js'
import { isTaskOverdue } from '../../lib/taskQueries.js'
import { validateRecurrence } from '../../data/recurrence.js'
import { cn } from '../../lib/cn.js'

const EMPTY = {
  title: '',
  description: '',
  notes: '',
  status: TASK_STATUS.INBOX,
  priority: 0,
  projectId: null,
  listId: null,
  tagIds: [],
  dueDate: null,
  dueTime: null,
  startDate: null,
  endDate: null,
  estimatedMinutes: null,
  recurrence: null,
  reminderMinutesBefore: null,
  location: '',
  url: '',
  color: null,
}

export function TaskEditorDialog() {
  const { editor, closeTaskEditor } = useUI()
  if (!editor) return null
  return <TaskEditorForm key={editor.draft?.id || 'new'} mode={editor.mode} draft={editor.draft} onClose={closeTaskEditor} />
}

function TaskEditorForm({ mode, draft, onClose }) {
  const actions = useAppActions()
  const { projects, lists } = useAppState()
  const toast = useToast()
  const [form, setForm] = useState(() => ({ ...EMPTY, ...stripUndefined(draft) }))
  const [showMore, setShowMore] = useState(() => Boolean(draft?.notes || draft?.location || draft?.url || draft?.startDate || draft?.recurrence))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [applyParsing, setApplyParsing] = useState(mode === 'create')
  const titleRef = useRef(null)

  const parsed = useMemo(() => (applyParsing && form.title ? parseTaskInput(form.title) : null), [applyParsing, form.title])
  const suggestion = parsed && parsed.detected.length && parsed.title !== form.title ? parsed : null

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const activeProjects = projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE || p.id === form.projectId)

  function applySuggestion() {
    set({
      title: suggestion.title,
      dueDate: suggestion.dueDate ?? form.dueDate,
      dueTime: suggestion.dueTime ?? form.dueTime,
      recurrence: suggestion.recurrence ?? form.recurrence,
      priority: suggestion.priority ?? form.priority,
      estimatedMinutes: suggestion.estimatedMinutes ?? form.estimatedMinutes,
    })
    setApplyParsing(false)
  }

  async function save(andNew = false) {
    const title = form.title.trim()
    if (!title) {
      setError('Give the task a title.')
      titleRef.current?.focus()
      return
    }
    if (form.recurrence) {
      const v = validateRecurrence(form.recurrence)
      if (!v.valid) return setError(v.reason)
      if (!form.dueDate) return setError('Repeating tasks need a due date for the first occurrence.')
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) return setError('The end date must be after the start date.')
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form, title, url: form.url || null, allDay: !form.dueTime }
      if (mode === 'edit') {
        await actions.updateTask(draft.id, payload)
        toast.success('Task updated')
      } else {
        await actions.addTask(payload)
        toast.success('Task added')
      }
      if (andNew) {
        setForm({ ...EMPTY, projectId: form.projectId, listId: form.listId, dueDate: form.dueDate })
        setApplyParsing(true)
        titleRef.current?.focus()
      } else onClose()
    } catch (e) {
      setError(e.message || 'Could not save the task.')
    } finally {
      setSaving(false)
    }
  }

  const overdue = form.dueDate ? isTaskOverdue({ ...form, status: TASK_STATUS.PLANNED, deletedAt: null }) : false

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'edit' ? 'Edit task' : 'New task'}
      size="lg"
      footer={
        <>
          {error ? (
            <p role="alert" className="mr-auto text-xs text-error">
              {error}
            </p>
          ) : (
            <span className="mr-auto text-xs text-ink-muted hidden sm:inline">Ctrl+Enter to save</span>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {mode === 'create' ? (
            <Button variant="secondary" onClick={() => save(true)} disabled={saving}>
              Save and add another
            </Button>
          ) : null}
          <Button variant="primary" onClick={() => save(false)} loading={saving}>
            {mode === 'edit' ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          save(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            save(false)
          }
        }}
      >
        <div>
          <input
            ref={titleRef}
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="What needs to be done?"
            aria-label="Title"
            className="w-full bg-transparent text-lg font-medium text-ink placeholder:text-ink-faint outline-none border-b border-line focus:border-primary pb-2 transition-colors"
            maxLength={500}
          />
          {suggestion ? (
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-ink-muted">Use detected details:</span>
              <button type="button" onClick={applySuggestion} className="inline-flex items-center gap-1 rounded-sm bg-primary-soft text-primary px-2 h-6 font-medium hover:bg-primary-soft-hover">
                <Icon name="sparkles" size={12} />
                {[suggestion.dueDate && 'date', suggestion.dueTime && 'time', suggestion.recurrence && 'repeat', suggestion.priority !== null && 'priority'].filter(Boolean).join(', ')}
              </button>
              <button type="button" onClick={() => setApplyParsing(false)} className="text-ink-muted hover:text-ink">
                Keep as typed
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DatePickerButton date={form.dueDate} time={form.dueTime} overdue={overdue} onChange={({ date, time }) => set({ dueDate: date, dueTime: date ? time : null })} placeholder="Due date" />
          <Select size="sm" value={form.priority} onChange={(e) => set({ priority: Number(e.target.value) })} aria-label="Priority" className="w-36">
            {PRIORITY_LIST.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select size="sm" value={form.projectId || ''} onChange={(e) => set({ projectId: e.target.value || null })} aria-label="Project" className="w-40">
            <option value="">No project</option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          {lists.length ? (
            <Select size="sm" value={form.listId || ''} onChange={(e) => set({ listId: e.target.value || null })} aria-label="List" className="w-36">
              <option value="">No list</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Add more context" rows={2} />
        </Field>

        <Field label="Tags">
          <TagPicker value={form.tagIds} onChange={(tagIds) => set({ tagIds })} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Repeat">
            <RecurrenceEditor value={form.recurrence} onChange={(recurrence) => set({ recurrence })} anchorDate={form.dueDate} />
          </Field>
          <div className="flex flex-col gap-4">
            <Field label="Reminder" hint={!form.dueTime ? 'Set a due time to enable reminders.' : undefined}>
              <Select value={form.reminderMinutesBefore ?? ''} disabled={!form.dueTime} onChange={(e) => set({ reminderMinutesBefore: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Reminder">
                <option value="">No reminder</option>
                {REMINDER_OFFSETS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estimated duration">
              <div className="flex items-center gap-2">
                <Select value={DURATION_PRESETS.includes(form.estimatedMinutes) ? form.estimatedMinutes : form.estimatedMinutes ? 'custom' : ''} onChange={(e) => set({ estimatedMinutes: e.target.value === '' ? null : e.target.value === 'custom' ? form.estimatedMinutes || 30 : Number(e.target.value) })} aria-label="Estimated duration">
                  <option value="">Not set</option>
                  {DURATION_PRESETS.map((m) => (
                    <option key={m} value={m}>
                      {m >= 60 ? `${m / 60} h${m % 60 ? ` ${m % 60} m` : ''}` : `${m} min`}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </Select>
                {form.estimatedMinutes && !DURATION_PRESETS.includes(form.estimatedMinutes) ? (
                  <Input type="number" min={1} max={1440} value={form.estimatedMinutes} onChange={(e) => set({ estimatedMinutes: Number(e.target.value) || null })} className="w-24" aria-label="Minutes" />
                ) : null}
              </div>
            </Field>
          </div>
        </div>

        <button type="button" onClick={() => setShowMore((v) => !v)} className="self-start inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" aria-expanded={showMore}>
          <Icon name={showMore ? 'chevron-up' : 'chevron-down'} size={14} />
          {showMore ? 'Fewer options' : 'More options'}
        </button>

        {showMore ? (
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set({ status: e.target.value })} aria-label="Status">
                {TASK_STATUS_LIST.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Color">
              <div className="flex items-center gap-1.5 flex-wrap h-9">
                <button type="button" aria-label="No color" aria-pressed={!form.color} onClick={() => set({ color: null })} className={cn('h-6 w-6 rounded-full border border-line-strong flex items-center justify-center text-ink-muted', !form.color && 'ring-2 ring-primary/40')}>
                  <Icon name="circle-slash" size={12} />
                </button>
                {COLOR_SWATCHES.map((c) => (
                  <button key={c.id} type="button" aria-label={c.label} aria-pressed={form.color === c.id} onClick={() => set({ color: c.id })} className={cn('h-6 w-6 rounded-full border-2 border-transparent', form.color === c.id && 'ring-2 ring-primary/40')} style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </Field>
            <Field label="Start date">
              <Input type="date" value={form.startDate || ''} onChange={(e) => set({ startDate: e.target.value || null })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate || ''} min={form.startDate || undefined} onChange={(e) => set({ endDate: e.target.value || null })} />
            </Field>
            <Field label="Location">
              <Input icon="map-pin" value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="Where does this happen?" />
            </Field>
            <Field label="Link">
              <Input icon="link" type="url" value={form.url || ''} onChange={(e) => set({ url: e.target.value })} placeholder="https://" inputMode="url" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={4} placeholder="Private notes, checklists, references" />
            </Field>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}

function stripUndefined(obj) {
  if (!obj) return {}
  const out = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out
}
