import { createPortal } from 'react-dom'
import { Button, IconButton } from '../ui/Button.jsx'
import { Dropdown, MenuItem, MenuLabel } from '../ui/Dropdown.jsx'
import { PriorityFlag, ColorDot } from '../ui/Badge.jsx'
import { DatePickerPanel } from '../ui/DatePicker.jsx'
import { useAppActions, useAppState } from '../../store/AppStore.jsx'
import { useToast } from '../ui/Toast.jsx'
import { PRIORITY_LIST, PROJECT_STATUS } from '../../constants/task.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'

export function BulkActionBar({ selectedIds, allIds, onSelectAll, onClear, onExit }) {
  const actions = useAppActions()
  const { projects, tags } = useAppState()
  const toast = useToast()
  const confirmDelete = useConfirmDelete()
  const count = selectedIds.length
  const disabled = count === 0
  const activeProjects = projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE)

  function done(message, undo) {
    onExit()
    toast.success(message, { action: undo ? { label: 'Undo', onClick: undo } : undefined })
  }

  return createPortal(
    <div role="toolbar" aria-label="Bulk actions" className="fixed z-40 bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-3xl animate-toast-in">
      <div className="flex items-center gap-1.5 rounded-lg border border-line bg-elevated shadow-lg px-2 py-1.5 overflow-x-auto scrollbar-none">
        <span className="text-sm font-medium text-ink px-2 whitespace-nowrap tabular">{count} selected</span>
        <Button size="sm" variant="ghost" onClick={count === allIds.length ? onClear : onSelectAll}>
          {count === allIds.length ? 'Clear' : 'All'}
        </Button>
        <div className="h-5 w-px bg-line mx-0.5" />
        <Button size="sm" variant="ghost" icon="check" disabled={disabled} onClick={() => actions.completeTasks(selectedIds).then(() => done(`${count} completed`))}>
          Complete
        </Button>
        <Dropdown title="Schedule" width="w-auto" trigger={({ toggle, props }) => <Button size="sm" variant="ghost" icon="calendar" disabled={disabled} onClick={toggle} {...props}>Date</Button>}>
          {({ close }) => (
            <DatePickerPanel
              date={null}
              time={null}
              showTime={false}
              onChange={({ date }) => {
                actions.setDueDate(selectedIds, date).then(() => done(date ? 'Rescheduled' : 'Dates removed'))
                close()
              }}
            />
          )}
        </Dropdown>
        <Dropdown title="Priority" trigger={({ toggle, props }) => <Button size="sm" variant="ghost" icon="flag" disabled={disabled} onClick={toggle} {...props}>Priority</Button>}>
          {PRIORITY_LIST.map((p) => (
            <MenuItem key={p.value} onSelect={() => actions.setPriority(selectedIds, p.value).then(() => done('Priority updated'))}>
              <span className="inline-flex items-center gap-2">{p.value > 0 ? <PriorityFlag priority={p.value} /> : null}{p.label}</span>
            </MenuItem>
          ))}
        </Dropdown>
        <Dropdown title="Project" trigger={({ toggle, props }) => <Button size="sm" variant="ghost" icon="folder" disabled={disabled} onClick={toggle} {...props}>Project</Button>}>
          <MenuItem icon="circle-slash" onSelect={() => actions.setProject(selectedIds, null).then(() => done('Removed from project'))}>No project</MenuItem>
          {activeProjects.map((p) => (
            <MenuItem key={p.id} onSelect={() => actions.setProject(selectedIds, p.id).then(() => done(`Moved to ${p.name}`))}>
              <span className="inline-flex items-center gap-2"><ColorDot color={p.color} />{p.name}</span>
            </MenuItem>
          ))}
        </Dropdown>
        <Dropdown title="Tags" trigger={({ toggle, props }) => <Button size="sm" variant="ghost" icon="tag" disabled={disabled || !tags.length} onClick={toggle} {...props}>Tags</Button>}>
          <MenuLabel>Add tag</MenuLabel>
          {tags.map((t) => (
            <MenuItem key={`add-${t.id}`} onSelect={() => actions.addTagToTasks(selectedIds, t.id).then(() => done(`Tagged ${t.name}`))}>
              <span className="inline-flex items-center gap-2"><ColorDot color={t.color} />{t.name}</span>
            </MenuItem>
          ))}
          <MenuLabel>Remove tag</MenuLabel>
          {tags.map((t) => (
            <MenuItem key={`rm-${t.id}`} icon="x" onSelect={() => actions.removeTagFromTasks(selectedIds, t.id).then(() => done(`Removed ${t.name}`))}>
              {t.name}
            </MenuItem>
          ))}
        </Dropdown>
        <Button size="sm" variant="ghost" icon="archive" disabled={disabled} onClick={() => actions.archiveTasks(selectedIds).then(() => done(`${count} archived`, () => actions.unarchiveTasks(selectedIds)))}>
          Archive
        </Button>
        <Button
          size="sm"
          variant="danger-ghost"
          icon="trash-2"
          disabled={disabled}
          onClick={() => confirmDelete(selectedIds, () => actions.trashTasks(selectedIds).then(() => done(`${count} moved to trash`, () => actions.restoreTasks(selectedIds))))}
        >
          Delete
        </Button>
        <div className="flex-1" />
        <IconButton icon="x" label="Exit selection" size="sm" onClick={onExit} />
      </div>
    </div>,
    document.body,
  )
}
