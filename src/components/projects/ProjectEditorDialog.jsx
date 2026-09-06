import { useState } from 'react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { Input, Textarea, Select, Field } from '../ui/Input.jsx'
import { Icon } from '../ui/Icon.jsx'
import { COLOR_SWATCHES, PROJECT_ICONS, PROJECT_STATUS_LIST, PROJECT_STATUS } from '../../constants/task.js'
import { useAppActions } from '../../store/AppStore.jsx'
import { cn } from '../../lib/cn.js'

export function ProjectEditorDialog({ open, onClose, project, onSaved }) {
  const actions = useAppActions()
  const [form, setForm] = useState(() => ({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || 'blue',
    icon: project?.icon || 'folder',
    dueDate: project?.dueDate || '',
    status: project?.status || PROJECT_STATUS.ACTIVE,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  async function save() {
    if (!form.name.trim()) return setError('Give the project a name.')
    setSaving(true)
    try {
      const payload = { ...form, name: form.name.trim(), dueDate: form.dueDate || null }
      const saved = project ? await actions.updateProject(project.id, payload) : await actions.addProject(payload)
      onSaved?.(saved)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'New project'}
      footer={
        <>
          {error ? <p role="alert" className="mr-auto text-xs text-error">{error}</p> : null}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>{project ? 'Save' : 'Create project'}</Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="Name" htmlFor="project-name">
          <Input id="project-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Website redesign" data-autofocus maxLength={200} />
        </Field>
        <Field label="Description" htmlFor="project-desc">
          <Textarea id="project-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} placeholder="What does done look like?" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Color">
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLOR_SWATCHES.map((c) => (
                <button key={c.id} type="button" aria-label={c.label} aria-pressed={form.color === c.id} onClick={() => set({ color: c.id })} className={cn('h-7 w-7 rounded-full transition-transform', form.color === c.id && 'ring-2 ring-offset-2 ring-primary/50 scale-105')} style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </Field>
          <Field label="Icon">
            <div className="flex items-center gap-1 flex-wrap">
              {PROJECT_ICONS.map((icon) => (
                <button key={icon} type="button" aria-label={icon.replace('-', ' ')} aria-pressed={form.icon === icon} onClick={() => set({ icon })} className={cn('h-8 w-8 rounded-md border flex items-center justify-center transition-colors', form.icon === icon ? 'bg-ink text-white border-ink' : 'bg-surface border-line text-ink-secondary hover:bg-sunken')}>
                  <Icon name={icon} size={16} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Due date" htmlFor="project-due">
            <Input id="project-due" type="date" value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          </Field>
          <Field label="Status" htmlFor="project-status">
            <Select id="project-status" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {PROJECT_STATUS_LIST.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}
