import type { Metadata } from "next";
import { absoluteUrl, canonicalUrl, normalizePath } from "@/lib/seo/canonical";

const SITE_NAME = "CricScore";

export function buildAppMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const path = normalizePath(opts.path);
  const url = absoluteUrl(path);
  const fullTitle = opts.title.includes(SITE_NAME)
    ? opts.title
    : `${opts.title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description: opts.description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
    robots: { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl(path),
    },
    openGraph: {
      title: fullTitle,
      description: opts.description,
      siteName: SITE_NAME,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: opts.description,
    },
  };
}

// Re-export for modules that only need origin
export { siteBaseUrl } from "@/lib/seo/canonical";
