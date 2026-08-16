"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import FavoritesDrawer from "@/components/user/FavoritesDrawer";
import SearchDialog from "@/components/search/SearchDialog";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { Match } from "@/lib/data/matches";
import { cn } from "@/lib/utils";

async function fetchLiveCurrent(): Promise<Match[]> {
  const res = await fetch("/api/cricket/live");
  const json: unknown = await res.json();
  const body = json as { ok?: boolean; data?: Match[] };
  if (!res.ok || !body.ok || !Array.isArray(body.data)) return [];
  return body.data;
}

function CricketBallDot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      aria-hidden
      className={cn("inline-block h-2 w-2 shrink-0", className)}
    >
      <circle cx="4" cy="4" r="3.5" fill="var(--color-brand)" />
      <path
        d="M2 2.5c1.2 1.5 2.5 2.2 4 2.5M6 5.5c-1.2-1.5-2.5-2.2-4-2.5"
        stroke="var(--color-brand-light)"
        strokeWidth="0.6"
        fill="none"
      />
    </svg>
  );
}

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function IconCalendar({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

function IconSearch({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function IconHeart({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 20.5l-1.1-1C5.4 14.8 2 11.6 2 7.9 2 5 4.2 2.8 7 2.8c1.7 0 3.3.8 4.3 2.1C12.3 3.6 13.9 2.8 15.6 2.8 18.4 2.8 20.6 5 20.6 7.9c0 3.7-3.4 6.9-8.9 11.6L12 20.5z" />
    </svg>
  );
}

function IconTrophy({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM5 4H3v2a4 4 0 004 4M19 4h2v2a4 4 0 01-4 4" />
    </svg>
  );
}

const desktopNav = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/rankings", label: "Rankings" },
  { href: "/news", label: "News" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const { data: liveMatches } = useSWR("cricket-live-current", fetchLiveCurrent, {
    refreshInterval: 20_000,
    dedupingInterval: 8_000,
    revalidateOnFocus: true,
  });

  const liveCount = useMemo(
    () => (liveMatches ?? []).filter((m) => m.isLive).length,
    [liveMatches]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openSearch = () => setSearchOpen(true);

  return (
    <>
      <header className="sticky top-0 z-50 border-b-[0.5px] border-[var(--color-border-tertiary)] bg-white pt-[max(0px,env(safe-area-inset-top))] dark:bg-zinc-950">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-0.5 text-lg tracking-tight">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">Cric</span>
            <span className="font-bold text-[var(--color-brand)]">Score</span>
            <CricketBallDot className="ml-0.5 self-center" />
          </Link>

          <nav aria-label="Main" className="hidden flex-1 justify-center md:flex">
            <ul className="flex items-center gap-8">
              {desktopNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "text-[var(--color-brand)]"
                        : "text-[var(--color-text-secondary)] hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openSearch}
                  className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Search
                </button>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {liveCount > 0 ? (
              <span className="hidden rounded-md bg-[var(--color-brand)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white md:inline">
                LIVE {liveCount}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-50 flex h-14 border-t-[0.5px] border-[var(--color-border-tertiary)] bg-white pb-[env(safe-area-inset-bottom)] dark:bg-zinc-950 md:hidden"
      >
        <Link
          href="/"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
            pathname === "/"
              ? "text-[var(--color-brand)]"
              : "text-[var(--color-text-secondary)]"
          )}
        >
          <IconHome active={pathname === "/"} />
          Home
        </Link>
        <Link
          href="/schedule"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
            pathname === "/schedule"
              ? "text-[var(--color-brand)]"
              : "text-[var(--color-text-secondary)]"
          )}
        >
          <IconCalendar active={pathname === "/schedule"} />
          Schedule
        </Link>
        <Link
          href="/rankings"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
            pathname === "/rankings"
              ? "text-[var(--color-brand)]"
              : "text-[var(--color-text-secondary)]"
          )}
        >
          <IconTrophy active={pathname === "/rankings"} />
          Rankings
        </Link>
        <button
          type="button"
          onClick={openSearch}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]"
        >
          <IconSearch />
          Search
        </button>
        <button
          type="button"
          onClick={() => setFavoritesOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]"
        >
          <IconHeart />
          Favorites
        </button>
      </nav>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <FavoritesDrawer open={favoritesOpen} onOpenChange={setFavoritesOpen} />
    </>
  );
}
