import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ background: '#f8f9ff' }}
        >
          <div className="max-w-md w-full bg-white rounded-xl shadow-card p-8 text-center border border-outline-variant">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
              style={{ background: '#fee2e2' }}
            >
              ⚠️
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#0b1c30' }}>
              Something went wrong
            </h1>
            <p className="text-sm mb-6" style={{ color: '#444651' }}>
              An unexpected error occurred. Please refresh the page or go back to the home screen.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
              <button
                onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
                className="btn-secondary"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
