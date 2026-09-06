import { Component } from 'react'
import { ErrorState } from '../components/ui/States.jsx'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (this.props.onError) this.props.onError(error, info)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <ErrorState
            title={this.props.title || 'This view ran into a problem'}
            description={this.state.error?.message || 'An unexpected error occurred. Your data is safe.'}
            onRetry={() => this.setState({ error: null })}
          />
        )
      )
    }
    return this.props.children
  }
}
