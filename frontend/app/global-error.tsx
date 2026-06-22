"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-zinc-200">
        <h1 className="text-lg font-semibold text-zinc-50">Something went wrong</h1>
        <p className="max-w-md text-sm text-zinc-500">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
