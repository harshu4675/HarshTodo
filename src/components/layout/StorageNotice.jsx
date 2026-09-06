import { useState } from 'react'
import { useAppState } from '../../store/AppStore.jsx'
import { InlineNotice } from '../ui/States.jsx'
import { IconButton } from '../ui/Button.jsx'

export function StorageNotice() {
  const { persistent, storageNotice, corruptCount } = useAppState()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  if (persistent && !corruptCount) return null
  return (
    <div className="px-4 sm:px-6 pt-3 max-w-4xl mx-auto w-full">
      <InlineNotice tone="warning" action={<IconButton icon="x" label="Dismiss" size="xs" onClick={() => setDismissed(true)} />}>
        {!persistent
          ? `Data is kept in memory only for this session and will be lost when you close the tab. ${storageNotice || ''}`
          : `${corruptCount} stored ${corruptCount === 1 ? 'task was' : 'tasks were'} unreadable and skipped. Everything else loaded normally.`}
      </InlineNotice>
    </div>
  )
}
