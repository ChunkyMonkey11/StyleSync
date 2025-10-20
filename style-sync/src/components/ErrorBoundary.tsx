import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * ErrorBoundary - Catches React errors and displays fallback UI
 * This helps debug white screen issues by showing what actually failed
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { 
    hasError: false, 
    error: null,
    errorInfo: null 
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console for debugging
    console.error('❌ ErrorBoundary caught an error:')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    
    // Store error info in state
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-50">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-red-600 font-bold text-2xl mb-4">
              ⚠️ Something Went Wrong
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Error Message:</div>
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200 font-mono">
                {this.state.error?.toString()}
              </div>
            </div>

            {this.state.error?.stack && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Stack Trace:</div>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 font-mono overflow-auto max-h-40">
                  {this.state.error.stack}
                </div>
              </div>
            )}

            {this.state.errorInfo?.componentStack && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-700 mb-2">Component Stack:</div>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 font-mono overflow-auto max-h-32">
                  {this.state.errorInfo.componentStack}
                </div>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>

            <div className="mt-4 text-xs text-gray-500 text-center">
              If this error persists, check the console for more details
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}


