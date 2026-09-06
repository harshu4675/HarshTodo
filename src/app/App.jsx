import { useCallback } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppStoreProvider } from '../store/AppStore.jsx'
import { ToastProvider, useToast } from '../components/ui/Toast.jsx'
import { UIProvider } from './UIContext.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { ConfirmDeleteProvider } from '../hooks/useConfirmDelete.js'
import { AppRoutes } from './routes.jsx'

function StoreWithToasts({ children }) {
  const toast = useToast()
  const onError = useCallback(
    (error, context) => {
      toast.error(context ? `Could not ${context}` : 'Something went wrong', { description: error?.message })
    },
    [toast],
  )
  return <AppStoreProvider onError={onError}>{children}</AppStoreProvider>
}

export function App() {
  return (
    <ErrorBoundary title="HarshTodo could not start">
      <BrowserRouter>
        <ToastProvider>
          <StoreWithToasts>
            <UIProvider>
              <ConfirmDeleteProvider>
                <AppRoutes />
              </ConfirmDeleteProvider>
            </UIProvider>
          </StoreWithToasts>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
