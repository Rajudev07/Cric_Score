import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-6 text-center">
      <p className="tabular-nums text-[72px] font-light text-[var(--color-brand)]">404</p>
      <h1 className="mt-2 text-xl font-medium text-foreground">Match not found</h1>
      <p className="mt-3 max-w-[360px] text-sm text-[var(--color-text-secondary)]">
        The match, player, or page you&apos;re looking for doesn&apos;t exist or may have ended.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">View live scores</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/schedule">Schedule</Link>
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Looking for a specific match? Try search (Ctrl+K)
      </p>
    </div>
  );
}
