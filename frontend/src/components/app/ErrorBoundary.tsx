'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 md:p-6 mx-auto my-4 md:my-8 max-w-2xl rounded-lg border border-red-800 bg-red-900/20">
          <h2 className="text-lg md:text-xl font-bold text-red-500 mb-3 md:mb-4">Something went wrong</h2>
          <div className="bg-black/50 p-3 md:p-4 rounded overflow-auto max-h-[200px] md:max-h-[300px] mb-3 md:mb-4">
            <pre className="text-red-300 text-xs md:text-sm break-words whitespace-pre-wrap">
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
          </div>
          <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 md:px-4 md:py-2 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors text-sm md:text-base w-full sm:w-auto"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;