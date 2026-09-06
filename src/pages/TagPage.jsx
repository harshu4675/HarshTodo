import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { FilterBar } from '../components/tasks/FilterBar.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { ColorDot } from '../components/ui/Badge.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { applyFilter, EMPTY_FILTER } from '../lib/filters.js'
import { dateThenOrderComparator } from '../lib/taskQueries.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function TagPage() {
  const { tagId } = useParams()
  const { tags, tasks } = useAppState()
  const navigate = useNavigate()
  const tag = tags.find((t) => t.id === tagId)
  useDocumentTitle(tag ? `#${tag.name}` : 'Tag')
  const [filter, setFilter] = useState({ ...EMPTY_FILTER })
  const result = useMemo(() => applyFilter(tasks, { ...filter, tagIds: Array.from(new Set([tagId, ...filter.tagIds])) }).sort(dateThenOrderComparator), [tasks, filter, tagId])
  if (!tag) {
    return (
      <Page>
        <EmptyState icon="tag" title="Tag not found" action={{ label: 'All tags', onClick: () => navigate('/tags') }} />
      </Page>
    )
  }
  return (
    <Page>
      <PageHeader eyebrow="Tag" title={<span className="inline-flex items-center gap-2.5"><ColorDot color={tag.color} size={12} />{tag.name}</span>} />
      <QuickAdd className="mb-4" defaults={{ tagIds: [tag.id] }} placeholder={`Add a task tagged ${tag.name}`} />
      <FilterBar filter={filter} onChange={setFilter} className="mb-4" allowSave={false} />
      <TaskList tasks={result} ariaLabel={`Tasks tagged ${tag.name}`} emptyState={<EmptyState icon="tag" title={`No tasks tagged ${tag.name}`} description="Add one above or tag existing tasks from their actions menu." />} />
    </Page>
  )
}
