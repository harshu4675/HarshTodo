import { useMemo, useState } from 'react'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { selectCompleted, completedAtDescComparator } from '../lib/taskQueries.js'
import { formatRelativeDate, todayKey } from '../lib/dates.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useConfirmDelete } from '../hooks/useConfirmDelete.js'
import { TASK_STATUS } from '../constants/task.js'

export default function CompletedPage() {
  useDocumentTitle('Completed')
  const { tasks } = useAppState()
  const actions = useAppActions()
  const toast = useToast()
  const confirm = useConfirmDelete()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const groups = useMemo(() => {
    const base = showArchived ? tasks.filter((t) => !t.deletedAt && t.status === TASK_STATUS.ARCHIVED) : selectCompleted(tasks)
    const q = query.trim().toLowerCase()
    const list = base.filter((t) => !q || t.title.toLowerCase().includes(q)).sort(completedAtDescComparator)
    const map = new Map()
    for (const t of list) {
      const key = (t.completedAt || t.updatedAt).slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, label: formatRelativeDate(key), sublabel: key === todayKey() ? '' : key, tasks: items }))
  }, [tasks, query, showArchived])
  const all = groups.flatMap((g) => g.tasks)

  function clearOld() {
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
    const ids = all.filter((t) => (t.completedAt || t.updatedAt) < cutoff).map((t) => t.id)
    if (!ids.length) return toast.info('Nothing older than 30 days')
    confirm(ids, () => actions.trashTasks(ids).then(() => toast.success(`${ids.length} moved to trash`, { action: { label: 'Undo', onClick: () => actions.restoreTasks(ids) } })), {
      title: `Move ${ids.length} old ${ids.length === 1 ? 'task' : 'tasks'} to trash?`,
      message: 'Tasks completed more than 30 days ago will be moved to the trash.',
      force: true,
    })
  }

  return (
    <Page>
      <PageHeader
        title={showArchived ? 'Archived' : 'Completed'}
        subtitle={showArchived ? 'Tasks set aside without finishing them.' : 'Your finished work, newest first.'}
        actions={
          <>
            <Button size="sm" variant="ghost" icon={showArchived ? 'circle-check' : 'archive'} onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Show completed' : 'Show archived'}
            </Button>
            {!showArchived && all.length ? (
              <Button size="sm" variant="secondary" icon="trash-2" onClick={clearOld}>
                Clear older than 30 days
              </Button>
            ) : null}
          </>
        }
      />
      <Input icon="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search completed tasks" aria-label="Search completed tasks" className="mb-4 sm:max-w-sm" />
      <TaskList
        groups={groups}
        tasks={all}
        ariaLabel={showArchived ? 'Archived tasks' : 'Completed tasks'}
        emptyState={
          showArchived ? (
            <EmptyState icon="archive" title="No archived tasks" description="Archive tasks you want to keep for reference without seeing them in your lists." />
          ) : (
            <EmptyState icon="circle-check" title="No completed tasks yet" description="Finished tasks are kept here so you can look back on what you accomplished." />
          )
        }
      />
    </Page>
  )
}
