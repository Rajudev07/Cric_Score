import type { CommentaryItem, Match } from "@/lib/data/matches";

export type HighlightTone = "run" | "wicket" | "pressure" | "milestone";

export interface HighlightCard {
  id: string;
  title: string;
  subtitle?: string;
  tone: HighlightTone;
}

function slug(s: string, i: number): string {
  return `${i}-${s.slice(0, 24).replace(/\s+/g, "-")}`;
}

/**
 * Rule-based highlight cards from status + recent commentary.
 */
export function buildMatchHighlights(match: Match): HighlightCard[] {
  const out: HighlightCard[] = [];
  const status = match.status;

  const need = status.match(/need\s+(\d+)\s+from\s+(\d+)/i);
  if (need) {
    out.push({
      id: "eq-need",
      title: `Equation: need ${need[1]} from ${need[2]}`,
      subtitle: status.slice(0, 120),
      tone: "pressure",
    });
  }

  const tail: CommentaryItem[] = match.commentary.slice(-40);
  let i = 0;
  for (const c of tail) {
    const t = c.text;
    if (/\b50\b|fifty|half[- ]century/i.test(t)) {
      out.push({
        id: slug(t, i++),
        title: "Milestone — fifty zone",
        subtitle: t.slice(0, 140),
        tone: "milestone",
      });
    } else if (/\b100\b|century|ton\b/i.test(t)) {
      out.push({
        id: slug(t, i++),
        title: "Milestone — big hundred",
        subtitle: t.slice(0, 140),
        tone: "milestone",
      });
    } else if (/partnership.*\b(100|150|200)\b/i.test(t)) {
      out.push({
        id: slug(t, i++),
        title: "Partnership landmark",
        subtitle: t.slice(0, 140),
        tone: "run",
      });
    } else if (
      /\bwicket\b|\bout!\b|caught\b|bowled\b|lbw\b|stumped\b|run out\b/i.test(t)
    ) {
      out.push({
        id: slug(t, i++),
        title: "Wicket — shift in control",
        subtitle: t.slice(0, 140),
        tone: "wicket",
      });
    }
  }

  const seen = new Set<string>();
  const deduped: HighlightCard[] = [];
  for (const h of out) {
    const k = h.title + (h.subtitle ?? "");
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(h);
  }
  return deduped.slice(0, 8);
}
