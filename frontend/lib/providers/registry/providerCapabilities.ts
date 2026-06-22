export type ProviderCapability = {
  id: string;
  supportsLive: boolean;
  supportsScorecard: boolean;
  supportsCommentary: boolean;
  supportsIPL: boolean;
  trustScore: number;
  freshnessWeight: number;
};

/** Declarative capabilities for federation + ops. */
export const PROVIDER_CAPABILITIES: Record<string, ProviderCapability> = {
  "cricbuzz-scraper": {
    id: "cricbuzz-scraper",
    supportsLive: true,
    supportsScorecard: true,
    supportsCommentary: true,
    supportsIPL: true,
    trustScore: 0.62,
    freshnessWeight: 1.15,
  },
  cricketdata: {
    id: "cricketdata",
    supportsLive: true,
    supportsScorecard: true,
    supportsCommentary: true,
    supportsIPL: true,
    trustScore: 0.9,
    freshnessWeight: 1.0,
  },
  cricbuzz: {
    id: "cricbuzz",
    supportsLive: true,
    supportsScorecard: true,
    supportsCommentary: true,
    supportsIPL: true,
    trustScore: 0.72,
    freshnessWeight: 1.05,
  },
};

export function getProviderCapability(id: string): ProviderCapability | null {
  const mapped = id === "cricbuzz_scraper" ? "cricbuzz-scraper" : id;
  return PROVIDER_CAPABILITIES[id] ?? PROVIDER_CAPABILITIES[mapped] ?? null;
}
