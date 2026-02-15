import { ReactNode, Component, ErrorInfo } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errors: Array<{
    error: Error;
    errorInfo: ErrorInfo;
    timestamp: string;
    id: string;
  }>;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      errors: [], // Array to collect multiple errors
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const newError = {
      error: error,
      errorInfo: errorInfo,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    };

    this.setState(prevState => ({
      errors: [...prevState.errors, newError]
    }));

    // Log error to console as fallback
    console.error('Error caught by ErrorBoundary', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: newError.timestamp
    });
  }

  handleClearErrors = (): void => {
    this.setState({ 
      hasError: false,
      errors: []
    });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.errors.length > 0) {
      return (
        <div className="error-boundary min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8 animate-fade-in">
              {/* Error Icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/25">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  {/* Sparkles */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-400 rounded-full animate-ping animation-delay-200"></div>
                </div>
              </div>

              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Oops! Something went wrong
              </h1>
              <p className="text-lg text-gray-300 mb-2">
                We caught {this.state.errors.length} error{this.state.errors.length > 1 ? 's' : ''} in the system
              </p>
              <p className="text-sm text-gray-400">
                Don't worry, our team has been notified. Try the options below to get back on track.
              </p>
            </div>

            {/* Error Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {this.state.errors.map((errorItem, index: number) => (
                <div 
                  key={errorItem.id} 
                  className="bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-xl overflow-hidden shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Error Card Header */}
                  <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 px-4 py-3 border-b border-red-500/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-red-400">Error #{index + 1}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(errorItem.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <details className="cursor-pointer">
                        <summary className="text-xs text-gray-300 hover:text-white transition-colors">
                          Details
                        </summary>
                      </details>
                    </div>
                  </div>

                  {/* Error Card Content */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Error Message */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                          </svg>
                          <span className="text-sm font-semibold text-red-400">Error Message</span>
                        </div>
                        <pre className="text-xs bg-red-500/10 border border-red-500/20 rounded p-2 text-red-300 overflow-x-auto font-mono">
                          {errorItem.error && errorItem.error.toString()}
                        </pre>
                      </div>

                      {/* Component Stack */}
                      {errorItem.errorInfo && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-sm font-semibold text-orange-400">Component Stack</span>
                          </div>
                          <pre className="text-xs bg-orange-500/10 border border-orange-500/20 rounded p-2 text-orange-300 overflow-x-auto font-mono max-h-32 overflow-y-auto">
                            {errorItem.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorItem.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in animation-delay-500">
              <button
                onClick={() => window.location.reload()}
                className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reload Page
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              <button
                onClick={this.handleClearErrors}
                className="group relative px-6 py-3 bg-slate-700 border border-slate-600 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Try Continue
                </span>
              </button>

              <button
                onClick={() => window.open('https://github.com/rickypcyt/vitejs-uni-tracker/issues', '_blank')}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 font-semibold rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 012.968 10.326" />
                  </svg>
                  Report Issue
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-gray-400 animate-fade-in animation-delay-700">
              <p>Error ID: {this.state.errors.map(e => e.id).join(', ')}</p>
              <p className="mt-1">UniTracker</p>
            </div>
          </div>

          <style>{`
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slide-up {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            .animate-fade-in {
              animation: fade-in 0.6s ease-out forwards;
            }
            
            .animate-slide-up {
              animation: slide-up 0.5s ease-out forwards;
            }
            
            .animation-delay-200 { animation-delay: 200ms; }
            .animation-delay-500 { animation-delay: 500ms; }
            .animation-delay-700 { animation-delay: 700ms; }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 