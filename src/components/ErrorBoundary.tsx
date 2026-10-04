import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GreenLens ErrorBoundary Caught]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#f8fafb] flex items-center justify-center p-6 text-[#191c1d]">
          <div className="w-full max-w-md bg-white rounded-3xl p-7 border border-[#e1e3e4] shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#006b5e] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">eco</span>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-extrabold text-[#191c1d]">
                GreenLens no ha podido iniciarse
              </h1>
              <p className="text-xs text-[#526360] leading-relaxed">
                Se ha producido un error al cargar la aplicación. Inténtalo de nuevo.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left">
                <p className="text-[11px] font-mono text-[#526360] break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-[#006b5e] hover:bg-[#005247] text-white text-xs font-bold transition-all shadow-md shadow-[#006b5e]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
