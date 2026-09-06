import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { NamedEntityEditor } from '../components/projects/NamedEntityEditor.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { ColorDot } from '../components/ui/Badge.jsx'
import { ConfirmDialog } from '../components/ui/Modal.jsx'
import { Dropdown, MenuItem } from '../components/ui/Dropdown.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { isOpen } from '../lib/taskQueries.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function ListsPage() {
  useDocumentTitle('Lists')
  const { lists, tasks } = useAppState()
  const actions = useAppActions()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const rows = useMemo(
    () => lists.sort((a, b) => a.order - b.order).map((l) => ({ list: l, open: tasks.filter((t) => t.listId === l.id && isOpen(t)).length, total: tasks.filter((t) => t.listId === l.id && !t.deletedAt).length })),
    [lists, tasks],
  )

  return (
    <Page>
      <PageHeader title="Lists" subtitle="Lightweight buckets like Errands, Reading or Someday. Tasks can belong to a project and a list at once." actions={<Button variant="primary" size="sm" icon="plus" onClick={() => setEditing({})}>New list</Button>} />
      {rows.length ? (
        <ul className="flex flex-col gap-1.5">
          {rows.map(({ list, open, total }) => (
            <li key={list.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 h-12 hover:border-line-strong transition-colors">
              <ColorDot color={list.color} size={10} />
              <Link to={`/lists/${list.id}`} className="flex-1 min-w-0 text-sm font-medium text-ink truncate">
                {list.name}
              </Link>
              <span className="text-xs text-ink-muted tabular">
                {open} open of {total}
              </span>
              <Dropdown align="end" trigger={({ toggle, props }) => <IconButton icon="more-horizontal" label={`Actions for ${list.name}`} size="sm" onClick={toggle} {...props} />}>
                <MenuItem icon="pencil" onSelect={() => setEditing(list)}>Rename</MenuItem>
                <MenuItem icon="trash-2" danger onSelect={() => setDeleting(list)}>Delete</MenuItem>
              </Dropdown>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="list" title="No lists yet" description="Create a list for a context like Errands or Reading and assign tasks to it from the editor." action={{ label: 'Create a list', icon: 'plus', onClick: () => setEditing({}) }} />
      )}
      {editing ? (
        <NamedEntityEditor open onClose={() => setEditing(null)} title={editing.id ? 'Rename list' : 'New list'} entity={editing.id ? editing : null} placeholder="Errands" onSave={(data) => (editing.id ? actions.updateList(editing.id, data) : actions.addList(data))} />
      ) : null}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title={`Delete "${deleting?.name}"?`} message="Tasks in this list are kept; they just lose the list assignment." confirmLabel="Delete list" onConfirm={() => actions.deleteList(deleting.id).then(() => setDeleting(null))} />
    </Page>
  )
}
