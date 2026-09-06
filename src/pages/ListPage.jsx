import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { ColorDot } from '../components/ui/Badge.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { selectByList, isOpen, orderComparator } from '../lib/taskQueries.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function ListPage() {
  const { listId } = useParams()
  const { lists, tasks } = useAppState()
  const navigate = useNavigate()
  const list = lists.find((l) => l.id === listId)
  useDocumentTitle(list?.name || 'List')
  const open = useMemo(() => selectByList(tasks, listId).filter(isOpen).sort(orderComparator), [tasks, listId])
  if (!list) {
    return (
      <Page>
        <EmptyState icon="list" title="List not found" action={{ label: 'All lists', onClick: () => navigate('/lists') }} />
      </Page>
    )
  }
  return (
    <Page>
      <PageHeader eyebrow="List" title={<span className="inline-flex items-center gap-2.5"><ColorDot color={list.color} size={12} />{list.name}</span>} />
      <QuickAdd className="mb-5" defaults={{ listId: list.id }} placeholder={`Add to ${list.name}`} />
      <TaskList tasks={open} reorderable ariaLabel={`${list.name} tasks`} emptyState={<EmptyState icon="list" title={`${list.name} is empty`} description="Add tasks above or assign existing ones from the task editor." />} />
    </Page>
  )
}
