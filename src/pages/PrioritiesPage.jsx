import { useMemo } from 'react'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { PriorityFlag } from '../components/ui/Badge.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { isOpen, dateThenOrderComparator } from '../lib/taskQueries.js'
import { PRIORITY_LIST } from '../constants/task.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useUI } from '../app/UIContext.jsx'

export default function PrioritiesPage() {
  useDocumentTitle('Priorities')
  const { tasks } = useAppState()
  const { openTaskEditor } = useUI()
  const groups = useMemo(() => {
    const open = tasks.filter(isOpen)
    return PRIORITY_LIST.map((p) => ({
      key: `p${p.value}`,
      label: p.label,
      sublabel: p.shortLabel,
      tasks: open.filter((t) => t.priority === p.value).sort(dateThenOrderComparator),
    }))
  }, [tasks])
  const all = groups.flatMap((g) => g.tasks)
  const counts = groups.map((g) => ({ ...g, count: g.tasks.length }))

  return (
    <Page>
      <PageHeader title="Priorities" subtitle="Open tasks grouped from most to least urgent." />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {counts.map((g, i) => (
          <div key={g.key} className="rounded-md border border-line bg-surface px-3 py-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm">
              <PriorityFlag priority={PRIORITY_LIST[i].value} />
              <span className="text-ink-secondary">{g.label}</span>
            </span>
            <span className="text-sm font-semibold tabular">{g.count}</span>
          </div>
        ))}
      </div>
      <TaskList
        groups={groups}
        tasks={all}
        ariaLabel="Tasks by priority"
        emptyState={<EmptyState icon="flag" title="No open tasks to prioritize" description="Set a priority on a task and it will show up in the matching group." action={{ label: 'New task', icon: 'plus', onClick: () => openTaskEditor({ priority: 3 }) }} />}
      />
    </Page>
  )
}
