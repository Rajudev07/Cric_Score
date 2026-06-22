/** Canonical URLs, site origin, and path normalization (no trailing slash). */

export function siteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cricscore.app";
  return raw.replace(/\/$/, "");
}

export function getSiteMetadataBase(): URL {
  return new URL(siteBaseUrl());
}

export function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  const trimmed = path.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function absoluteUrl(path: string): string {
  const p = normalizePath(path);
  return `${siteBaseUrl()}${p === "/" ? "" : p}`;
}

export function canonicalUrl(path: string): string {
  return absoluteUrl(path);
}
