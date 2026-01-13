'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center'>
          <div className='rounded-full bg-amber-100 p-4 dark:bg-amber-900/20'>
            <AlertTriangle className='h-10 w-10 text-amber-600 dark:text-amber-400' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold'>Something went wrong</h2>
            <p className='text-muted-foreground max-w-md text-sm'>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details className='mt-4 text-left'>
                <summary className='text-muted-foreground cursor-pointer text-xs hover:underline'>
                  Error details
                </summary>
                <pre className='bg-muted mt-2 max-h-32 overflow-auto rounded p-2 text-xs'>
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
          <div className='flex gap-3'>
            <Button variant='outline' onClick={this.handleReset}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try again
            </Button>
            <Button variant='default' onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
