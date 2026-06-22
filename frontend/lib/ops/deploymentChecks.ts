export type DeploymentCheck = {
  id: string;
  ok: boolean;
  detail?: string;
};

export function runDeploymentChecks(): DeploymentCheck[] {
  const checks: DeploymentCheck[] = [];

  checks.push({
    id: "site_url",
    ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    detail: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "unset (default canonical host)",
  });

  checks.push({
    id: "cricket_api_key",
    ok: Boolean(process.env.CRIC_API_KEY?.trim()),
    detail: process.env.CRIC_API_KEY ? "set" : "missing",
  });

  checks.push({
    id: "sentry_dsn",
    ok: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()),
    detail: process.env.NEXT_PUBLIC_SENTRY_DSN ? "set" : "optional",
  });

  checks.push({
    id: "posthog",
    ok: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()),
    detail: process.env.NEXT_PUBLIC_POSTHOG_KEY ? "set" : "optional",
  });

  checks.push({
    id: "upstash_redis",
    ok: Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
    ),
    detail:
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? "set"
        : "optional",
  });

  checks.push({
    id: "node_env",
    ok: true,
    detail: process.env.NODE_ENV ?? "unknown",
  });

  return checks;
}
