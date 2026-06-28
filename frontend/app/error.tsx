"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportClientRuntimeError } from "@/lib/monitoring/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientRuntimeError(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" aria-hidden />
      <h1 className="mt-4 text-xl font-medium text-foreground">Something went wrong</h1>
      <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
        A page error occurred. This has been logged.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2 text-left text-xs text-foreground">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Go home
        </Button>
      </div>
    </div>
  );
}
