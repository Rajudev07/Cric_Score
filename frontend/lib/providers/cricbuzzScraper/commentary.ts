import type { CommentaryItem } from "@/lib/data/matches";

function asRec(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function str(v: unknown, d = ""): string {
  if (v === undefined || v === null) return d;
  return String(v);
}

function num(v: unknown, d = -1): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function formatOverLabel(r: Record<string, unknown>): string {
  const ov = num(r.overNumber ?? r.ovrNbr ?? r.ovr ?? r.overNbr ?? r.over ?? r.o, -1);
  const bn = num(r.ballNumber ?? r.ballNbr ?? r.ballNBR ?? r.nbr ?? r.b ?? r.bn, -1);
  if (ov >= 0 && bn >= 0) {
    return `${Math.floor(ov)}.${bn}`;
  }
  const raw = str(r.over ?? r.ov ?? r.ball ?? "").trim();
  const m = raw.match(/^(\d+)\.(\d+)/);
  if (m) return `${m[1]}.${m[2]}`;
  if (ov >= 0) return String(Math.floor(ov));
  return "";
}

function isCommentaryLike(o: unknown): boolean {
  const r = asRec(o);
  if (!r) return false;
  return Boolean(
    r.commText ??
      r.text ??
      r.commentary ??
      r.description ??
      r.comm ??
      r.comment ??
      r.commTxt
  );
}

function extractText(r: Record<string, unknown>): string {
  const evt = asRec(r.event);
  return str(
    r.commText ??
      r.commTxt ??
      r.text ??
      r.commentary ??
      r.description ??
      r.comm ??
      r.comment ??
      evt?.commText ??
      evt?.text ??
      ""
  ).trim();
}

/**
 * Extract commentary lines from embedded JSON (Cricbuzz commLines / commentaryList shapes).
 */
export function extractCommentaryFromJsonRoots(
  roots: unknown[],
  maxItems = 500
): CommentaryItem[] {
  const out: CommentaryItem[] = [];
  const seen = new Set<string>();

  function pushLines(rows: unknown[]): void {
    for (const row of rows) {
      const r = asRec(row);
      if (!r) continue;
      const text = extractText(r);
      if (!text) continue;
      let over = formatOverLabel(r);
      if (!over) {
        const evt = asRec(r.event);
        if (evt) over = formatOverLabel(evt);
      }
      if (!over) over = str(r.over ?? r.ov ?? "").trim();
      const key = `${over}|${text.slice(0, 200)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ over: over.trim() || "—", text });
      if (out.length >= maxItems) return;
    }
  }

  function walk(node: unknown): void {
    if (out.length >= maxItems) return;
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      if (
        node.length > 0 &&
        node.every((x) => typeof x === "object" && x !== null && isCommentaryLike(x))
      ) {
        pushLines(node);
        return;
      }
      for (const x of node) walk(x);
      return;
    }
    const r = asRec(node);
    if (!r) return;

    const commKeys = [
      "commentary",
      "commentaryList",
      "commLines",
      "commentaries",
      "comments",
      "ballCommentary",
      "comm",
      "commlines",
      "miniScore",
      "ballList",
    ];
    for (const k of commKeys) {
      const arr = r[k];
      if (Array.isArray(arr) && arr.length && isCommentaryLike(arr[0])) {
        pushLines(arr);
      }
    }

    const overSummary = asRec(r.overSummary);
    if (overSummary) {
      for (const k of ["recentOvers", "balls", "commLines", "commentary"]) {
        const arr = overSummary[k];
        if (Array.isArray(arr) && arr.length && isCommentaryLike(arr[0])) {
          pushLines(arr);
        }
      }
    }

    for (const v of Object.values(r)) walk(v);
  }

  for (const root of roots) walk(root);

  return out.slice(-maxItems);
}
