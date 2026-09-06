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

export default function TagsPage() {
  useDocumentTitle('Tags')
  const { tags, tasks } = useAppState()
  const actions = useAppActions()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const rows = useMemo(
    () =>
      tags
        .map((tag) => ({ tag, open: tasks.filter((t) => isOpen(t) && t.tagIds.includes(tag.id)).length, total: tasks.filter((t) => !t.deletedAt && t.tagIds.includes(tag.id)).length }))
        .sort((a, b) => b.open - a.open || a.tag.name.localeCompare(b.tag.name)),
    [tags, tasks],
  )

  return (
    <Page>
      <PageHeader title="Tags" subtitle="Cross-cutting labels. Type #tag in quick add to apply one instantly." actions={<Button variant="primary" size="sm" icon="plus" onClick={() => setEditing({})}>New tag</Button>} />
      {rows.length ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {rows.map(({ tag, open, total }) => (
            <div key={tag.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 h-12 hover:border-line-strong transition-colors">
              <ColorDot color={tag.color} size={10} />
              <Link to={`/tags/${tag.id}`} className="flex-1 min-w-0 text-sm font-medium text-ink truncate">
                {tag.name}
              </Link>
              <span className="text-xs text-ink-muted tabular">
                {open} open / {total}
              </span>
              <Dropdown align="end" trigger={({ toggle, props }) => <IconButton icon="more-horizontal" label={`Actions for ${tag.name}`} size="sm" onClick={toggle} {...props} />}>
                <MenuItem icon="pencil" onSelect={() => setEditing(tag)}>Edit</MenuItem>
                <MenuItem icon="trash-2" danger onSelect={() => setDeleting(tag)}>Delete</MenuItem>
              </Dropdown>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="tag" title="No tags yet" description="Tags like waiting, quick or deep-work help you slice tasks across projects." action={{ label: 'Create a tag', icon: 'plus', onClick: () => setEditing({}) }} />
      )}
      {editing ? (
        <NamedEntityEditor open onClose={() => setEditing(null)} title={editing.id ? 'Edit tag' : 'New tag'} entity={editing.id ? editing : null} placeholder="deep-work" onSave={(data) => (editing.id ? actions.updateTag(editing.id, data) : actions.addTag(data))} />
      ) : null}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title={`Delete tag "${deleting?.name}"?`} message="The tag is removed from every task. Tasks themselves are not deleted." confirmLabel="Delete tag" onConfirm={() => actions.deleteTag(deleting.id).then(() => setDeleting(null))} />
    </Page>
  )
}
