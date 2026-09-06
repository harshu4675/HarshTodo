import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { FilterBar } from '../components/tasks/FilterBar.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Select } from '../components/ui/Input.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { applyFilter, EMPTY_FILTER, isFilterEmpty } from '../lib/filters.js'
import { dateThenOrderComparator, priorityThenDateComparator, orderComparator } from '../lib/taskQueries.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useNow } from '../hooks/useNow.js'
import { useUI } from '../app/UIContext.jsx'

const SORTS = [
  { value: 'manual', label: 'Manual order', compare: orderComparator },
  { value: 'date', label: 'Due date', compare: dateThenOrderComparator },
  { value: 'priority', label: 'Priority', compare: priorityThenDateComparator },
  { value: 'created', label: 'Newest first', compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  { value: 'title', label: 'Title', compare: (a, b) => a.title.localeCompare(b.title) },
]

function filterFromParams(params) {
  const f = { ...EMPTY_FILTER }
  if (params.get('completion')) f.completion = params.get('completion')
  if (params.get('date')) f.dateRange = params.get('date')
  if (params.get('priority')) f.priorities = params.get('priority').split(',').map(Number)
  if (params.get('project')) f.projectIds = params.get('project').split(',')
  if (params.get('tag')) f.tagIds = params.get('tag').split(',')
  if (params.get('overdue') === '1') f.overdueOnly = true
  if (params.get('recurring') === '1') f.recurringOnly = true
  if (params.get('status')) f.statuses = params.get('status').split(',')
  return f
}

export default function TasksPage() {
  useDocumentTitle('All tasks')
  const { tasks } = useAppState()
  const { openTaskEditor } = useUI()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState(() => filterFromParams(params))
  const [sort, setSort] = useState('date')
  const now = useNow()

  const result = useMemo(() => {
    const list = applyFilter(tasks, filter, now)
    const compare = SORTS.find((s) => s.value === sort)?.compare || orderComparator
    return list.sort(compare)
  }, [tasks, filter, sort, now])

  return (
    <Page width="max-w-5xl">
      <PageHeader
        title="All tasks"
        subtitle="Every open task across projects, lists and tags."
        actions={
          <Select size="sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tasks" className="w-40">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        }
      />
      <QuickAdd className="mb-4" />
      <FilterBar filter={filter} onChange={setFilter} className="mb-4" />
      <TaskList
        tasks={result}
        reorderable={sort === 'manual'}
        ariaLabel="All tasks"
        emptyState={
          isFilterEmpty(filter) ? (
            <EmptyState icon="list-checks" title="No open tasks" description="Add your first task above. Natural language like 'every Monday at 9am' is understood." action={{ label: 'New task', icon: 'plus', onClick: () => openTaskEditor() }} />
          ) : (
            <EmptyState icon="filter" title="No tasks match these filters" description="Try widening the date range or clearing a filter." action={{ label: 'Clear filters', icon: 'x', onClick: () => setFilter({ ...EMPTY_FILTER }) }} />
          )
        }
      />
    </Page>
  )
}
