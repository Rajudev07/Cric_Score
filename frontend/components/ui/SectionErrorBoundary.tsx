"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; label: string };
type State = { error: Error | null };

export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[section:${this.props.label}]`, error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-5 text-sm text-red-200/90">
          This section failed to load ({this.props.label}).
        </div>
      );
    }
    return this.props.children;
  }
}
