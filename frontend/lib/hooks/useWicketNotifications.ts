"use client";

import { useEffect, useRef } from "react";
import type { Match } from "@/lib/data/matches";
import { showBrowserNotification } from "@/lib/notifications/browserNotify";

function extractWicketLine(commentary: Match["commentary"]): string | null {
  const tail = commentary.slice(-8);
  for (let i = tail.length - 1; i >= 0; i--) {
    const c = tail[i]!;
    if (
      /\b(wicket|caught|bowled|lbw|stumped|run out|OUT!)\b/i.test(c.text) ||
      /\bout!\b/i.test(c.text)
    ) {
      return c.text.replace(/\s+/g, " ").slice(0, 160);
    }
  }
  return null;
}

function batterFromWicket(text: string): string {
  const m = text.match(/^([A-Za-z][A-Za-z\s.'-]{2,40})/);
  return m?.[1]?.trim() ?? "Batter";
}

/** Background-tab wicket alerts on match detail polling. */
export function useWicketNotifications(match: Match): void {
  const prevLen = useRef(match.commentary.length);
  const prevText = useRef("");

  useEffect(() => {
    if (document.visibilityState === "visible") {
      prevLen.current = match.commentary.length;
      prevText.current = match.commentary.at(-1)?.text ?? "";
      return;
    }
    if (match.commentary.length <= prevLen.current) return;
    const line = extractWicketLine(match.commentary);
    if (!line || line === prevText.current) return;
    prevLen.current = match.commentary.length;
    prevText.current = line;
    const batter = batterFromWicket(line);
    const score = match.score1 !== "—" ? match.score1 : match.score2;
    void showBrowserNotification(`${batter} out! ${match.team1} ${score}`, {
      body: line.slice(0, 120),
      tag: `wicket-${match.id}`,
    });
  }, [match]);
}
