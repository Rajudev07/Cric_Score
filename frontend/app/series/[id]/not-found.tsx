import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SeriesNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-[var(--color-text-secondary)]">Series not found or has ended.</p>
      <Button asChild className="mt-4">
        <Link href="/schedule">View schedule</Link>
      </Button>
    </div>
  );
}
