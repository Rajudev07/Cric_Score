export type MonitoringDomain =
  | "client_runtime"
  | "api_route"
  | "provider"
  | "scraper_parse"
  | "unknown";

export type MonitoringSeverity = "info" | "warn" | "error";

export type MonitoringPayload = {
  domain: MonitoringDomain;
  severity: MonitoringSeverity;
  message: string;
  stack?: string;
  route?: string;
  extra?: Record<string, unknown>;
  capturedAtIso: string;
};
