import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <strong>Something went wrong!</strong>
                    <p className="text-sm mt-2">
                      An error occurred while rendering the page. This might be due to a JavaScript error or missing component.
                    </p>
                  </div>
                  
                  {this.state.error && (
                    <div className="bg-muted p-3 rounded text-xs font-mono">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline" 
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Page
                    </Button>
                    <Button 
                      onClick={() => this.setState({ hasError: false })} 
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
