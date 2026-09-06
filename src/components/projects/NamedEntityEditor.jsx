import { useState } from 'react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { Input, Field } from '../ui/Input.jsx'
import { COLOR_SWATCHES } from '../../constants/task.js'
import { cn } from '../../lib/cn.js'

export function NamedEntityEditor({ open, onClose, title, entity, onSave, nameLabel = 'Name', placeholder }) {
  const [name, setName] = useState(entity?.name || '')
  const [color, setColor] = useState(entity?.color || 'slate')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    if (!name.trim()) return setError(`${nameLabel} is required.`)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), color })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={<>{error ? <p role="alert" className="mr-auto text-xs text-error">{error}</p> : null}<Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} loading={saving}>Save</Button></>}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label={nameLabel} htmlFor="entity-name">
          <Input id="entity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} data-autofocus maxLength={200} />
        </Field>
        <Field label="Color">
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_SWATCHES.map((c) => (
              <button key={c.id} type="button" aria-label={c.label} aria-pressed={color === c.id} onClick={() => setColor(c.id)} className={cn('h-7 w-7 rounded-full', color === c.id && 'ring-2 ring-offset-2 ring-primary/50')} style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  )
}
