import { LogoMark } from '../components/layout/Logo.jsx'
import { ErrorState } from '../components/ui/States.jsx'
import { Button } from '../components/ui/Button.jsx'

export function BootScreen({ failed, error }) {
  if (failed) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <ErrorState
          title="HarshTodo could not open its local database"
          description={error || 'The browser refused access to local storage. This can happen in private browsing or when storage is disabled.'}
          onRetry={() => window.location.reload()}
          retryLabel="Reload"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            const { deleteDatabase } = await import('../data/database.js')
            await deleteDatabase()
            window.location.reload()
          }}
        >
          Reset local database
        </Button>
      </div>
    )
  }
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <LogoMark size={40} />
      <p className="text-sm text-ink-muted">Loading your tasks</p>
    </div>
  )
}
