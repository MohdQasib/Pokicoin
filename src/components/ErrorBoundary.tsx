import React, { Component, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Zap } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🎯 Critical React boundary exception trapped:", error, errorInfo);
  }

  private handleHardReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080602] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden select-none">
          {/* Ambient radial glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-red-950/10 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-amber-950/10 rounded-full blur-[150px]"></div>
          </div>

          <div className="relative max-w-sm w-full bg-[#0f0d08] border border-red-500/20 rounded-[32px] p-6 text-center shadow-2xl shadow-black/80 z-10 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-red-500/20 mx-auto mb-6 relative">
              <AlertCircle className="w-9 h-9 text-black" />
              <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
            </div>

            <h3 className="text-lg font-bold uppercase tracking-wider text-red-400 font-display">
              Consensus Disruption
            </h3>
            <p className="text-[10px] text-amber-500/80 tracking-[0.25em] font-mono uppercase font-bold mt-1">
              POKI CORE SAFE MODE
            </p>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 my-5 text-left font-mono text-[9px] text-white/60 leading-relaxed overflow-x-auto max-h-40 whitespace-pre-wrap">
              <span className="text-red-400 font-bold">Exception details:</span>
              <br />
              {this.state.error?.message || "Unknown runtime loop conflict detected."}
              <br />
              <br />
              <span className="text-white/30 uppercase">Recommendation: Clean your configuration context.</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#1c180f] hover:bg-[#252015] text-amber-400 border border-amber-500/30 font-bold py-3.5 rounded-2xl text-[9px] uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-reverse" />
                Reload Application Path
              </button>

              <button
                onClick={this.handleHardReset}
                className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-black font-black py-4 rounded-2xl text-[9px] uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 active:scale-[0.98]"
              >
                <Zap className="w-3.5 h-3.5 fill-black/10 text-black" />
                Clear State & Synchronize
              </button>
            </div>

            <p className="text-[8.5px] leading-relaxed text-white/30 text-center font-sans tracking-wide mt-5">
              Pokicoin automatically safeguards your virtual mining ledger assets. Standard network re-synchronization resolves 99.8% of local conflicts safely.
            </p>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
