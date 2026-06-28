import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MatchNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-[var(--color-text-secondary)]">
        This match is no longer available or has not started yet.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">View live scores</Link>
      </Button>
    </div>
  );
}
