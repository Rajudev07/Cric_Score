const REJECT_PATH =
  /\/(highlights|video|videos|news|photo|photos|gallery|image|images|archives|archieve|shop|fantasy-cricket)(\/|$)/i;

const REJECT_FILE_EXT = /\.(mp4|webm|jpg|jpeg|png|gif|pdf)(\?|$)/i;

const PREFER_HINT =
  /live-cricket|live-scores|scorecard|commentary|full-commentary|live-cricket-score|cricket-match\/\d|\/\d{5,10}\//i;

/** Block obvious non-match / junk routes. */
export function isRejectableCricbuzzUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return true;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (!host.endsWith("cricbuzz.com")) return true;
  const path = u.pathname + u.search;
  if (REJECT_PATH.test(path)) return true;
  if (REJECT_FILE_EXT.test(path)) return true;
  return false;
}

export function isPreferredLiveUrl(url: string): boolean {
  if (isRejectableCricbuzzUrl(url)) return false;
  return PREFER_HINT.test(url);
}
