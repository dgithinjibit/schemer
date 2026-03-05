import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
            >
              <RefreshCcw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
