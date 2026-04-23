"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Reset boundary when this key changes (e.g. selected node id) */
  resetKey?: string | number | null;
  /** Label shown in the fallback — defaults to generic message */
  label?: string;
  /** Called when an error is caught (use to telemetry) */
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  lastResetKey: Props["resetKey"] = undefined;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", this.props.label || "caught", error, info);
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div
        className="flex flex-col items-center justify-center gap-3 p-6 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "var(--error-glow)" }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: "var(--error-text)" }} />
        </div>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {this.props.label || "Un souci est survenu"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {this.state.error.message?.slice(0, 160) || "Erreur inconnue"}
          </p>
        </div>
        <button
          onClick={() => this.setState({ error: null })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <RefreshCw className="w-3 h-3" />
          Réessayer
        </button>
      </div>
    );
  }
}
