import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MountAlgo Terminal] Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#05070a] text-white flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-[#0d1117] border border-red-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold tracking-wide text-white mb-1">
              Terminal Sesi Dipulihkan
            </h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Terdeteksi anomali pada state terminal. Seluruh data konfigurasi Anda aman di IndexedDB.
            </p>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              Muat Ulang Terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
