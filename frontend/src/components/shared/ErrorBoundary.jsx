import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-2xl shadow-depth p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-danger/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Error details
                </summary>
                <pre className="text-xs text-danger overflow-auto">
                  {this.state.error ? this.state.error.toString() : ''}
                  {this.state.errorInfo && this.state.errorInfo.componentStack ? '\n' + this.state.errorInfo.componentStack : ''}
                </pre>
              </details>
            )}
            <Button
              onClick={this.handleReset}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function SectionErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    const errorHandler = (error) => {
      console.error('Section error:', error)
      setHasError(true)
    }

    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])

  if (hasError) {
    return fallback || (
      <div className="p-6 bg-white dark:bg-dark-800 rounded-2xl shadow-soft">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Failed to load this section
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => setHasError(false)}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return children
}
