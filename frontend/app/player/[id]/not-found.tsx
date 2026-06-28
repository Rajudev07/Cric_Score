import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PlayerNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-[var(--color-text-secondary)]">Player profile not found.</p>
      <Button asChild className="mt-4">
        <Link href="/?search=1">Search for a player</Link>
      </Button>
    </div>
  );
}
