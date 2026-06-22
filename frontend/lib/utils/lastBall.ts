import type { CommentaryItem } from "@/lib/data/matches";

export function lastBallCommentaryLine(commentary: CommentaryItem[] | undefined): string | null {
  if (!commentary?.length) return null;
  const item = commentary[commentary.length - 1];
  if (!item?.text?.trim()) return null;
  const prefix = item.over?.trim() ? `${item.over} — ` : "";
  const line = `${prefix}${item.text.trim()}`;
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
}
