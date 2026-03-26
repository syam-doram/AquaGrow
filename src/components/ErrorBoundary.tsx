// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mb-8">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-[#4A2C2A] mb-4">Something went wrong.</h2>
          <p className="text-[#4A2C2A]/60 text-sm leading-relaxed mb-10 max-w-[240px]">
            We're sorry for the inconvenience. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#C78200] text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/20 active:scale-95 transition-all"
          >
            Refresh Now
          </button>
        </div>
      );
    }

    return this.props.children ?? null;
  }
}
