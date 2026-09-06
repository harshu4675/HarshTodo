import { useNavigate } from 'react-router-dom'
import { Page } from '../components/layout/PageHeader.jsx'
import { EmptyState } from '../components/ui/States.jsx'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Page>
      <EmptyState icon="circle-slash" title="Page not found" description="The address does not match any view in HarshTodo." action={{ label: 'Go to dashboard', onClick: () => navigate('/') }} />
    </Page>
  )
}
