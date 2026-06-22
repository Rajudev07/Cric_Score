/**
 * Structured commentary / ball-line classification for timeline & highlights.
 */

export type CommentaryEventType =
  | "wicket"
  | "four"
  | "six"
  | "milestone"
  | "partnership"
  | "review"
  | "dropped_catch"
  | "dot"
  | "extras"
  | "runs"
  | "neutral";

export interface ClassifiedCommentary {
  type: CommentaryEventType;
  /** Short label for chips (1–3 chars where possible) */
  chip: string;
}

export function classifyCommentaryText(text: string): ClassifiedCommentary {
  const t = text.toLowerCase();

  if (/drs|third umpire|umpire review|tv review|review\b/i.test(text)) {
    return { type: "review", chip: "REV" };
  }
  if (/dropped|grassed|put down|spills|shells/i.test(t)) {
    return { type: "dropped_catch", chip: "DRP" };
  }
  if (
    /half[- ]?century|fifty|century|ton\b|milestone|double century|\b\d{2,3}\s*off\s*\d+\s*balls/i.test(
      text
    )
  ) {
    return { type: "milestone", chip: "★" };
  }
  if (/partnership/i.test(t)) {
    return { type: "partnership", chip: "PT" };
  }
  if (
    /\bwicket\b|\bout!\b|\bout,|\bout:|caught\b|bowled\b|lbw\b|stumped\b|run out\b/i.test(
      text
    )
  ) {
    return { type: "wicket", chip: "W" };
  }
  if (/\bfour\b|\bfour!\b|\b4\s+runs\b/i.test(text)) {
    return { type: "four", chip: "4" };
  }
  if (/\bsix\b|\bsix!\b|\b6\s+runs\b/i.test(text)) {
    return { type: "six", chip: "6" };
  }
  if (
    /\bwide\b|\bno ball\b|\bno-ball\b|leg\s*bye|\bbye\b/i.test(t) &&
    !/\bwide\s+of\b/i.test(t)
  ) {
    return { type: "extras", chip: "ex" };
  }
  if (/no run|dot ball|no\s+run/i.test(t)) {
    return { type: "dot", chip: "·" };
  }
  if (/\d+\s+runs?|\bone run\b|\btwo runs\b|\bthree runs\b/i.test(t)) {
    return { type: "runs", chip: "▸" };
  }
  return { type: "neutral", chip: "•" };
}
