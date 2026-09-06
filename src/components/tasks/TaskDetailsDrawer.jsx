import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from '../ui/Drawer.jsx'
import { Button, IconButton } from '../ui/Button.jsx'
import { TaskCheckbox } from './TaskCheckbox.jsx'
import { TaskActionsMenu } from './TaskActionsMenu.jsx'
import { TagChip, ColorDot } from '../ui/Badge.jsx'
import { Icon } from '../ui/Icon.jsx'
import { DatePickerButton } from '../ui/DatePicker.jsx'
import { Select } from '../ui/Input.jsx'
import { ProgressBar } from '../ui/Progress.jsx'
import { EmptyState } from '../ui/States.jsx'
import { useAppActions, useAppState } from '../../store/AppStore.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { useTaskLookups } from '../../hooks/useTaskLookups.js'
import { TASK_STATUS, TASK_STATUS_LIST, PRIORITY_LIST, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_TASK } from '../../constants/task.js'
import { formatDuration, formatTimestamp, formatDateKey } from '../../lib/dates.js'
import { describeRecurrence } from '../../data/recurrence.js'
import { isTaskOverdue, subtaskProgress } from '../../lib/taskQueries.js'
import { cn } from '../../lib/cn.js'

export function TaskDetailsDrawer() {
  const { detailsTaskId, closeTaskDetails } = useUI()
  const { tasks } = useAppState()
  const task = detailsTaskId ? tasks.find((t) => t.id === detailsTaskId) : null
  return (
    <Drawer open={Boolean(detailsTaskId)} onClose={closeTaskDetails} title="Task" width="sm:max-w-lg" hideHeader>
      {task ? <TaskDetails task={task} onClose={closeTaskDetails} /> : <EmptyState icon="circle-slash" title="This task no longer exists" compact action={{ label: 'Close', onClick: closeTaskDetails }} />}
    </Drawer>
  )
}

function InlineText({ value, onSave, placeholder, multiline = false, className, ariaLabel }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef(null)
  useEffect(() => setDraft(value), [value])
  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])
  function commit() {
    setEditing(false)
    const next = draft.trim()
    if (next !== value) onSave(next)
  }
  if (editing) {
    const Tag = multiline ? 'textarea' : 'input'
    return (
      <Tag
        ref={ref}
        value={draft}
        rows={multiline ? 4 : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.stopPropagation()
            setDraft(value)
            setEditing(false)
          }
        }}
        aria-label={ariaLabel}
        className={cn('w-full bg-surface border border-primary rounded-md px-2 py-1.5 text-sm outline-none ring-2 ring-primary/15 resize-y', className)}
      />
    )
  }
  return (
    <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${ariaLabel}`} className={cn('w-full text-left rounded-md px-2 py-1.5 -mx-2 hover:bg-sunken transition-colors', !value && 'text-ink-faint', className)}>
      {value ? <span className="whitespace-pre-wrap break-words">{value}</span> : placeholder}
    </button>
  )
}

function TaskDetails({ task, onClose }) {
  const actions = useAppActions()
  const { openTaskEditor } = useUI()
  const { projectById, listById, tagById } = useTaskLookups()
  const toast = useToast()
  const navigate = useNavigate()
  const [newSubtask, setNewSubtask] = useState('')
  const fileRef = useRef(null)
  const completed = task.status === TASK_STATUS.COMPLETED
  const overdue = isTaskOverdue(task)
  const project = task.projectId ? projectById.get(task.projectId) : null
  const list = task.listId ? listById.get(task.listId) : null
  const tags = task.tagIds.map((id) => tagById.get(id)).filter(Boolean)
  const progress = subtaskProgress(task)

  async function addSubtask(e) {
    e.preventDefault()
    const title = newSubtask.trim()
    if (!title) return
    await actions.addSubtask(task.id, title)
    setNewSubtask('')
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    for (const file of files) {
      if (task.attachments.length >= MAX_ATTACHMENTS_PER_TASK) return toast.warning(`Up to ${MAX_ATTACHMENTS_PER_TASK} attachments per task.`)
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.warning(`${file.name} is larger than 2 MB and was skipped.`)
        continue
      }
      try {
        await actions.addAttachment(task.id, file)
      } catch (error) {
        toast.error('Could not store attachment', { description: error.message })
      }
    }
  }

  async function openAttachment(att) {
    const blob = await actions.getAttachmentBlob(att.id)
    if (!blob) return toast.error('Attachment data is missing.')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = att.name
    a.rel = 'noopener'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex items-center gap-2 px-3 sm:px-4 h-12 border-b border-line sticky top-0 bg-surface z-10">
        <IconButton icon="x" label="Close" size="sm" onClick={onClose} />
        <div className="flex-1" />
        <Button size="sm" variant="ghost" icon="timer" onClick={() => { onClose(); navigate(`/focus?task=${task.id}`) }}>
          Focus
        </Button>
        <Button size="sm" variant="secondary" icon="pencil" onClick={() => openTaskEditor(task)}>
          Edit
        </Button>
        <TaskActionsMenu task={task} />
      </header>

      <div className="px-4 sm:px-6 py-5 flex flex-col gap-6">
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <TaskCheckbox checked={completed} priority={task.priority} title={task.title} onToggle={() => actions.toggleTask(task.id)} />
          </div>
          <div className="flex-1 min-w-0">
            <InlineText value={task.title} ariaLabel="title" onSave={(title) => title && actions.updateTask(task.id, { title })} className={cn('text-lg font-semibold leading-6', completed && 'line-through text-ink-muted')} />
            <div className="mt-1 px-0">
              <InlineText value={task.description} ariaLabel="description" placeholder="Add a description" multiline onSave={(description) => actions.updateTask(task.id, { description })} className="text-sm text-ink-secondary leading-relaxed" />
            </div>
          </div>
        </div>

        {task.deletedAt ? (
          <div className="rounded-md bg-warning-soft text-warning text-sm px-3 py-2 flex items-center justify-between gap-2">
            <span>This task is in the trash.</span>
            <Button size="xs" variant="secondary" onClick={() => actions.restoreTasks([task.id])}>
              Restore
            </Button>
          </div>
        ) : null}

        <dl className="grid grid-cols-[7rem_1fr] gap-y-3 gap-x-3 text-sm items-center">
          <dt className="text-ink-muted">Due</dt>
          <dd>
            <DatePickerButton date={task.dueDate} time={task.dueTime} overdue={overdue} variant="ghost" className="-ml-2.5" onChange={({ date, time }) => actions.rescheduleTask(task.id, date, time)} />
          </dd>
          <dt className="text-ink-muted">Priority</dt>
          <dd>
            <Select size="sm" value={task.priority} onChange={(e) => actions.setPriority([task.id], Number(e.target.value))} aria-label="Priority" className="w-40">
              {PRIORITY_LIST.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </dd>
          <dt className="text-ink-muted">Status</dt>
          <dd>
            <Select size="sm" value={task.status} onChange={(e) => actions.setStatus([task.id], e.target.value)} aria-label="Status" className="w-40">
              {TASK_STATUS_LIST.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </dd>
          {project ? (
            <>
              <dt className="text-ink-muted">Project</dt>
              <dd>
                <button type="button" onClick={() => { onClose(); navigate(`/projects/${project.id}`) }} className="inline-flex items-center gap-2 text-ink hover:underline">
                  <ColorDot color={project.color} />
                  {project.name}
                </button>
              </dd>
            </>
          ) : null}
          {list ? (
            <>
              <dt className="text-ink-muted">List</dt>
              <dd className="inline-flex items-center gap-2">
                <ColorDot color={list.color} />
                {list.name}
              </dd>
            </>
          ) : null}
          {task.recurrence ? (
            <>
              <dt className="text-ink-muted">Repeats</dt>
              <dd className="inline-flex items-center gap-1.5 text-ink">
                <Icon name="repeat" size={14} className="text-ink-muted" />
                {describeRecurrence(task.recurrence)}
              </dd>
            </>
          ) : null}
          {task.reminderMinutesBefore !== null && task.dueTime ? (
            <>
              <dt className="text-ink-muted">Reminder</dt>
              <dd className="inline-flex items-center gap-1.5">
                <Icon name="bell" size={14} className="text-ink-muted" />
                {task.reminderMinutesBefore === 0 ? 'At time of task' : `${formatDuration(task.reminderMinutesBefore)} before`}
              </dd>
            </>
          ) : null}
          {task.startDate || task.endDate ? (
            <>
              <dt className="text-ink-muted">Timeframe</dt>
              <dd>
                {task.startDate ? formatDateKey(task.startDate, 'MMM d') : 'Open'} to {task.endDate ? formatDateKey(task.endDate, 'MMM d, yyyy') : 'open'}
              </dd>
            </>
          ) : null}
          {task.estimatedMinutes || task.actualMinutes ? (
            <>
              <dt className="text-ink-muted">Time</dt>
              <dd className="tabular">
                {task.actualMinutes ? `${formatDuration(task.actualMinutes)} logged` : ''}
                {task.actualMinutes && task.estimatedMinutes ? ' of ' : ''}
                {task.estimatedMinutes ? `${formatDuration(task.estimatedMinutes)} estimated` : ''}
              </dd>
            </>
          ) : null}
          {task.location ? (
            <>
              <dt className="text-ink-muted">Location</dt>
              <dd className="inline-flex items-center gap-1.5">
                <Icon name="map-pin" size={14} className="text-ink-muted" />
                {task.location}
              </dd>
            </>
          ) : null}
          {task.url ? (
            <>
              <dt className="text-ink-muted">Link</dt>
              <dd>
                <a href={task.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline truncate max-w-full">
                  <Icon name="external-link" size={14} />
                  <span className="truncate">{task.url.replace(/^https?:\/\//, '')}</span>
                </a>
              </dd>
            </>
          ) : null}
          <dt className="text-ink-muted">Tags</dt>
          <dd className="flex items-center gap-1.5 flex-wrap">
            {tags.map((t) => (
              <TagChip key={t.id} tag={t} onRemove={() => actions.removeTagFromTasks([task.id], t.id)} />
            ))}
            <Button size="xs" variant="ghost" icon="plus" onClick={() => openTaskEditor(task)}>
              {tags.length ? 'Edit' : 'Add tag'}
            </Button>
          </dd>
        </dl>

        <section aria-labelledby="subtasks-heading">
          <div className="flex items-center justify-between mb-2">
            <h3 id="subtasks-heading" className="text-sm font-semibold text-ink">
              Subtasks
            </h3>
            {progress ? <span className="text-xs text-ink-muted tabular">{progress.done} of {progress.total}</span> : null}
          </div>
          {progress ? <ProgressBar value={progress.percent} label="Subtask progress" size="sm" className="mb-2" /> : null}
          <ul className="flex flex-col">
            {task.subtasks.map((s) => (
              <li key={s.id} className="group flex items-center gap-2.5 h-9 px-1 rounded-md hover:bg-sunken">
                <TaskCheckbox size="sm" checked={s.completed} title={s.title} onToggle={() => actions.updateSubtask(task.id, s.id, { completed: !s.completed })} />
                <div className="flex-1 min-w-0">
                  <InlineText value={s.title} ariaLabel="subtask title" onSave={(title) => (title ? actions.updateSubtask(task.id, s.id, { title }) : actions.removeSubtask(task.id, s.id))} className={cn('text-sm py-0.5', s.completed && 'line-through text-ink-muted')} />
                </div>
                <IconButton icon="x" label={`Remove subtask ${s.title}`} size="xs" onClick={() => actions.removeSubtask(task.id, s.id)} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" />
              </li>
            ))}
          </ul>
          <form onSubmit={addSubtask} className="flex items-center gap-2 mt-1 px-1">
            <Icon name="plus" size={16} className="text-ink-muted" />
            <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Add a subtask" aria-label="New subtask" className="flex-1 h-8 bg-transparent text-sm outline-none border-b border-transparent focus:border-primary" />
          </form>
        </section>

        <section aria-labelledby="notes-heading">
          <h3 id="notes-heading" className="text-sm font-semibold text-ink mb-1">
            Notes
          </h3>
          <InlineText value={task.notes} ariaLabel="notes" placeholder="Add notes" multiline onSave={(notes) => actions.updateTask(task.id, { notes })} className="text-sm text-ink-secondary leading-relaxed" />
        </section>

        <section aria-labelledby="attachments-heading">
          <div className="flex items-center justify-between mb-2">
            <h3 id="attachments-heading" className="text-sm font-semibold text-ink">
              Attachments
            </h3>
            <input ref={fileRef} type="file" multiple className="sr-only" onChange={onFiles} aria-label="Add attachment" />
            <Button size="xs" variant="ghost" icon="paperclip" onClick={() => fileRef.current?.click()}>
              Attach file
            </Button>
          </div>
          {task.attachments.length ? (
            <ul className="flex flex-col gap-1">
              {task.attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 h-9 px-2 rounded-md border border-line bg-canvas text-sm">
                  <Icon name="file-text" size={14} className="text-ink-muted shrink-0" />
                  <button type="button" onClick={() => openAttachment(a)} className="flex-1 min-w-0 text-left truncate hover:underline">
                    {a.name}
                  </button>
                  <span className="text-xs text-ink-muted tabular">{Math.max(1, Math.round(a.size / 1024))} KB</span>
                  <IconButton icon="x" label={`Remove ${a.name}`} size="xs" onClick={() => actions.removeAttachment(task.id, a.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ink-muted">Files up to 2 MB are stored locally on this device.</p>
          )}
        </section>

        <footer className="text-xs text-ink-muted flex flex-col gap-1 border-t border-line pt-4">
          <span>Created {formatTimestamp(task.createdAt)}</span>
          <span>Updated {formatTimestamp(task.updatedAt)}</span>
          {task.completedAt ? <span>Completed {formatTimestamp(task.completedAt)}</span> : null}
          {task.focusSessions ? <span>{task.focusSessions} focus {task.focusSessions === 1 ? 'session' : 'sessions'}</span> : null}
        </footer>
      </div>
    </div>
  )
}
