import { useMemo } from 'react'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { QuickAdd } from '../components/tasks/QuickAdd.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { selectInbox, orderComparator } from '../lib/taskQueries.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useSearchParams } from 'react-router-dom'
import { useUI } from '../app/UIContext.jsx'
import { useEffect } from 'react'

export default function InboxPage() {
  useDocumentTitle('Inbox')
  const { tasks } = useAppState()
  const [params, setParams] = useSearchParams()
  const { openTaskEditor } = useUI()
  const inbox = useMemo(() => selectInbox(tasks).sort(orderComparator), [tasks])

  useEffect(() => {
    if (params.get('new') === '1') {
      openTaskEditor()
      params.delete('new')
      setParams(params, { replace: true })
    }
  }, [params, setParams, openTaskEditor])

  return (
    <Page>
      <PageHeader title="Inbox" subtitle="Capture first, organize later. Tasks without a date or project land here." />
      <QuickAdd className="mb-5" placeholder='Capture a thought, for example "Renew passport next month"' />
      <TaskList
        tasks={inbox}
        reorderable
        ariaLabel="Inbox tasks"
        emptyState={
          <EmptyState
            icon="inbox"
            title="Inbox zero"
            description="Everything has a date or a home. New ideas you capture will wait here until you plan them."
          />
        }
      />
    </Page>
  )
}
