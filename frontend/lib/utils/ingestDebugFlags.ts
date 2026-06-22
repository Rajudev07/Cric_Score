/** Shared ingest debug flags — no dependency on IPL logic (avoids circular imports). */

export function ingestDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_IPL_INGEST === "true" ||
    process.env.DEBUG_IPL_INGEST === "true"
  );
}

export function debugForceLiveIngestEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEBUG_FORCE_LIVE_INGEST === "true";
}
