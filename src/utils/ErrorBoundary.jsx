import React from 'react';
import { logger } from '@/utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    logger.error('Error caught by ErrorBoundary', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="mb-4">We're sorry, but there was an error loading this page.<br />
            <span className="text-sm text-[var(--text-secondary)]">Try refreshing or clearing your browser cache. If the problem persists, contact support.</span>
          </p>
          <details style={{ whiteSpace: 'pre-wrap' }} className="w-full max-w-md mx-auto mb-4 bg-[var(--bg-secondary)] rounded p-3 text-left text-xs border border-[var(--border-primary)]">
            <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={() => window.location.reload()}
            className="retry-button px-4 py-2 rounded bg-[var(--accent-primary)] text-white font-semibold mt-2"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 