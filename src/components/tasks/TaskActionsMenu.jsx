import { useNavigate } from 'react-router-dom'
import { Dropdown, MenuItem, MenuSeparator, MenuLabel } from '../ui/Dropdown.jsx'
import { IconButton } from '../ui/Button.jsx'
import { PriorityFlag, ColorDot } from '../ui/Badge.jsx'
import { useAppActions, useAppState } from '../../store/AppStore.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { PRIORITY_LIST, TASK_STATUS, PROJECT_STATUS } from '../../constants/task.js'
import { todayKey, shiftDateKey } from '../../lib/dates.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'

export function TaskActionsMenu({ task, trigger, align = 'end' }) {
  const actions = useAppActions()
  const { projects, tags } = useAppState()
  const { openTaskEditor } = useUI()
  const toast = useToast()
  const navigate = useNavigate()
  const confirmDelete = useConfirmDelete()
  const completed = task.status === TASK_STATUS.COMPLETED
  const activeProjects = projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE)

  async function withUndo(label, run, undo) {
    await run()
    toast.success(label, { action: undo ? { label: 'Undo', onClick: undo } : undefined })
  }

  return (
    <Dropdown
      align={align}
      title="Task actions"
      width="w-60"
      trigger={trigger || (({ toggle, props }) => <IconButton icon="more-horizontal" label="Task actions" size="sm" onClick={toggle} {...props} />)}
    >
      <MenuItem icon="pencil" onSelect={() => openTaskEditor(task)} shortcut="E">
        Edit
      </MenuItem>
      <MenuItem icon={completed ? 'undo' : 'check'} onSelect={() => actions.toggleTask(task.id)} shortcut="Space">
        {completed ? 'Mark as not completed' : 'Complete'}
      </MenuItem>
      <MenuItem icon="timer" onSelect={() => navigate(`/focus?task=${task.id}`)}>
        Focus on this
      </MenuItem>
      <MenuSeparator />
      <MenuLabel>Reschedule</MenuLabel>
      <MenuItem icon="sun" onSelect={() => actions.rescheduleTask(task.id, todayKey())}>
        Today
      </MenuItem>
      <MenuItem icon="arrow-right" onSelect={() => actions.rescheduleTask(task.id, shiftDateKey(todayKey(), 1))}>
        Tomorrow
      </MenuItem>
      <MenuItem icon="calendar-days" onSelect={() => actions.rescheduleTask(task.id, shiftDateKey(todayKey(), 7))}>
        Next week
      </MenuItem>
      {task.dueDate ? (
        <MenuItem icon="circle-slash" onSelect={() => actions.rescheduleTask(task.id, null)}>
          Remove date
        </MenuItem>
      ) : null}
      <MenuSeparator />
      <MenuLabel>Priority</MenuLabel>
      {PRIORITY_LIST.map((p) => (
        <MenuItem key={p.value} onSelect={() => actions.setPriority([task.id], p.value)} checked={task.priority === p.value} icon={p.value === 0 ? 'flag' : undefined}>
          <span className="inline-flex items-center gap-2">
            {p.value > 0 ? <PriorityFlag priority={p.value} /> : null}
            {p.label}
          </span>
        </MenuItem>
      ))}
      {activeProjects.length ? (
        <>
          <MenuSeparator />
          <MenuLabel>Project</MenuLabel>
          {activeProjects.slice(0, 8).map((p) => (
            <MenuItem key={p.id} onSelect={() => actions.setProject([task.id], task.projectId === p.id ? null : p.id)} checked={task.projectId === p.id}>
              <span className="inline-flex items-center gap-2">
                <ColorDot color={p.color} />
                {p.name}
              </span>
            </MenuItem>
          ))}
        </>
      ) : null}
      {tags.length ? (
        <>
          <MenuSeparator />
          <MenuLabel>Tags</MenuLabel>
          {tags.slice(0, 8).map((t) => {
            const has = task.tagIds.includes(t.id)
            return (
              <MenuItem key={t.id} keepOpen onSelect={() => (has ? actions.removeTagFromTasks([task.id], t.id) : actions.addTagToTasks([task.id], t.id))} checked={has}>
                <span className="inline-flex items-center gap-2">
                  <ColorDot color={t.color} />
                  {t.name}
                </span>
              </MenuItem>
            )
          })}
        </>
      ) : null}
      <MenuSeparator />
      <MenuItem icon="copy" onSelect={() => actions.duplicateTask(task.id).then(() => toast.success('Task duplicated'))}>
        Duplicate
      </MenuItem>
      {task.status === TASK_STATUS.ARCHIVED ? (
        <MenuItem icon="archive-restore" onSelect={() => actions.unarchiveTasks([task.id])}>
          Unarchive
        </MenuItem>
      ) : (
        <MenuItem icon="archive" onSelect={() => withUndo('Task archived', () => actions.archiveTasks([task.id]), () => actions.unarchiveTasks([task.id]))}>
          Archive
        </MenuItem>
      )}
      {task.status !== TASK_STATUS.CANCELLED ? (
        <MenuItem icon="circle-x" onSelect={() => actions.setStatus([task.id], TASK_STATUS.CANCELLED)}>
          Cancel task
        </MenuItem>
      ) : null}
      <MenuItem
        icon="trash-2"
        danger
        shortcut="Del"
        onSelect={() =>
          confirmDelete([task.id], () => withUndo('Moved to trash', () => actions.trashTasks([task.id]), () => actions.restoreTasks([task.id])))
        }
      >
        Move to trash
      </MenuItem>
    </Dropdown>
  )
}
