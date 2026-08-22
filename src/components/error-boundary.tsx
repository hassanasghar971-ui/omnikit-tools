"use client";

import { Component, type ReactNode } from "react";

/**
 * Automatic state self-healing boundary.
 * If a tool crashes at runtime, the boundary auto-retries once after a
 * short pause (repairing local state without a full browser refresh);
 * only a repeated failure surfaces a manual reset control.
 */

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
  autoRetried: boolean;
  resetKey: number;
}

export class SelfHealingBoundary extends Component<Props, State> {
  state: State = { error: null, autoRetried: false, resetKey: 0 };
  private timer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[OmniKit self-healing]", error.message, info.componentStack ?? "");
  }

  componentDidUpdate(_prev: Props, prevState: State) {
    // Auto-repair: one silent retry before asking the user.
    if (this.state.error && !prevState.error && !this.state.autoRetried) {
      this.timer = setTimeout(() => {
        this.setState((s) => ({ error: null, autoRetried: true, resetKey: s.resetKey + 1 }));
      }, 1400);
    }
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  private reset = () => {
    this.setState((s) => ({ error: null, autoRetried: true, resetKey: s.resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-8 text-center">
          <span className="text-2xl">🛠️</span>
          <p className="text-sm font-medium text-rose-200">
            {this.props.label ?? "This tool"} hit a transient error — the self-healing engine is on it.
          </p>
          <p className="max-w-sm font-mono text-xs text-rose-300/70">{this.state.error.message}</p>
          <div className="flex gap-2">
            <button
              onClick={this.reset}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
            >
              ↻ Retry now
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition-colors hover:bg-white/10"
            >
              Full refresh
            </button>
          </div>
        </div>
      );
    }
    // key remounts children after a repair, resetting local state cleanly
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
