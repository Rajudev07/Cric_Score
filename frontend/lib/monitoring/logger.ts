import * as Sentry from "@sentry/nextjs";
import type { MonitoringPayload, MonitoringSeverity } from "@/lib/monitoring/types";

type MonitoringSink = (payload: MonitoringPayload) => void;

const sinks: MonitoringSink[] = [];

export function registerMonitoringSink(sink: MonitoringSink): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

function emitToSentry(payload: MonitoringPayload): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;
  try {
    const tags = { domain: payload.domain };
    const extra = { ...payload.extra, route: payload.route };
    if (payload.severity === "error" || payload.domain === "client_runtime") {
      const err = new Error(payload.message);
      if (payload.stack) err.stack = payload.stack;
      Sentry.captureException(err, { tags, extra });
      return;
    }
    Sentry.captureMessage(payload.message, {
      level: payload.severity === "warn" ? "warning" : "info",
      tags,
      extra,
    });
  } catch {
    /* optional */
  }
}

function emit(payload: MonitoringPayload): void {
  if (process.env.NODE_ENV === "development") {
    const fn = payload.severity === "error" ? console.error : console.warn;
    fn("[cricscore:monitor]", payload);
  }
  emitToSentry(payload);
  const endpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT?.trim();
  if (endpoint && typeof fetch !== "undefined") {
    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
  for (const s of sinks) {
    try {
      s(payload);
    } catch {
      /* sink isolation */
    }
  }
}

export function reportMonitoringEvent(
  partial: Omit<MonitoringPayload, "capturedAtIso"> & { capturedAtIso?: string }
): void {
  const payload: MonitoringPayload = {
    ...partial,
    capturedAtIso: partial.capturedAtIso ?? new Date().toISOString(),
  };
  emit(payload);
}

export function reportClientRuntimeError(err: unknown, extra?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  reportMonitoringEvent({
    domain: "client_runtime",
    severity: "error",
    message: e.message,
    stack: e.stack,
    extra,
  });
}

export function reportApiRouteFailure(
  route: string,
  err: unknown,
  extra?: Record<string, unknown>
): void {
  const e = err instanceof Error ? err : new Error(String(err));
  reportMonitoringEvent({
    domain: "api_route",
    severity: "warn",
    message: e.message,
    stack: e.stack,
    route,
    extra,
  });
}

export function reportProviderFailure(
  message: string,
  extra?: Record<string, unknown>,
  severity: MonitoringSeverity = "warn"
): void {
  reportMonitoringEvent({
    domain: "provider",
    severity,
    message,
    extra,
  });
}

export function reportScraperParseFailure(
  message: string,
  extra?: Record<string, unknown>
): void {
  reportMonitoringEvent({
    domain: "scraper_parse",
    severity: "warn",
    message,
    extra,
  });
}
