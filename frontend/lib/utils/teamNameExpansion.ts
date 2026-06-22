/** Expand common ICC short codes to full names for federation dedupe. */
const SHORT_CODE_MAP: Record<string, string> = {
  ind: "India",
  aus: "Australia",
  eng: "England",
  pak: "Pakistan",
  sa: "South Africa",
  nz: "New Zealand",
  sl: "Sri Lanka",
  wi: "West Indies",
  ban: "Bangladesh",
  afg: "Afghanistan",
  ire: "Ireland",
  zim: "Zimbabwe",
  sco: "Scotland",
  ned: "Netherlands",
  uae: "United Arab Emirates",
  nep: "Nepal",
  usa: "United States",
  nam: "Namibia",
  oman: "Oman",
};

export function expandTeamShortCode(name: string): string {
  const t = name.trim();
  if (!t) return t;
  const key = t.toLowerCase().replace(/[^a-z]/g, "");
  if (key.length <= 3 && SHORT_CODE_MAP[key]) return SHORT_CODE_MAP[key]!;
  return t;
}

export function teamSlug(name: string): string {
  return expandTeamShortCode(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 14);
}
