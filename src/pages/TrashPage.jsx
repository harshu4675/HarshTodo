import { useMemo, useState } from 'react'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { ConfirmDialog } from '../components/ui/Modal.jsx'
import { Checkbox } from '../components/ui/Input.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { selectTrash } from '../lib/taskQueries.js'
import { formatTimestamp } from '../lib/dates.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useUI } from '../app/UIContext.jsx'

export default function TrashPage() {
  useDocumentTitle('Trash')
  const { tasks } = useAppState()
  const actions = useAppActions()
  const toast = useToast()
  const { openTaskDetails } = useUI()
  const [confirm, setConfirm] = useState(null)
  const [checked, setChecked] = useState(() => new Set())
  const trashed = useMemo(() => selectTrash(tasks).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)), [tasks])
  const selected = Array.from(checked).filter((id) => trashed.some((t) => t.id === id))

  function toggle(id) {
    setChecked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function restore(ids) {
    await actions.restoreTasks(ids)
    setChecked(new Set())
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} restored`)
  }

  async function purge(ids) {
    await actions.deleteTasksForever(ids)
    setChecked(new Set())
    setConfirm(null)
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} deleted permanently`)
  }

  return (
    <Page>
      <PageHeader
        title="Trash"
        subtitle="Deleted tasks stay here for 30 days, then are removed automatically."
        actions={
          trashed.length ? (
            <>
              {selected.length ? (
                <>
                  <Button size="sm" variant="secondary" icon="rotate-ccw" onClick={() => restore(selected)}>
                    Restore {selected.length}
                  </Button>
                  <Button size="sm" variant="danger" icon="trash-2" onClick={() => setConfirm(selected)}>
                    Delete {selected.length}
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary" icon="rotate-ccw" onClick={() => restore(trashed.map((t) => t.id))}>
                    Restore all
                  </Button>
                  <Button size="sm" variant="danger" icon="trash-2" onClick={() => setConfirm(trashed.map((t) => t.id))}>
                    Empty trash
                  </Button>
                </>
              )}
            </>
          ) : null
        }
      />
      {trashed.length ? (
        <ul className="flex flex-col gap-1.5" aria-label="Trashed tasks">
          {trashed.map((task) => (
            <li key={task.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
              <Checkbox checked={checked.has(task.id)} onChange={() => toggle(task.id)} aria-label={`Select ${task.title}`} />
              <button type="button" onClick={() => openTaskDetails(task.id)} className="flex-1 min-w-0 text-left">
                <p className="text-sm text-ink truncate">{task.title}</p>
                <p className="text-xs text-ink-muted">Deleted {formatTimestamp(task.deletedAt, 'MMM d, h:mm a')}</p>
              </button>
              <IconButton icon="rotate-ccw" label={`Restore ${task.title}`} size="sm" onClick={() => restore([task.id])} />
              <IconButton icon="x" label={`Delete ${task.title} permanently`} size="sm" variant="danger-ghost" onClick={() => setConfirm([task.id])} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="trash-2" title="Trash is empty" description="Deleted tasks appear here and can be restored for 30 days." />
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => purge(confirm)}
        title={confirm?.length === 1 ? 'Delete task permanently?' : `Delete ${confirm?.length} tasks permanently?`}
        message="This cannot be undone. Attachments stored with these tasks are removed too."
        confirmLabel="Delete permanently"
      />
    </Page>
  )
}
