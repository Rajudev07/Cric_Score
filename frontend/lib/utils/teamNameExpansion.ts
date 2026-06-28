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
  indw: "India Women",
  ausw: "Australia Women",
  engw: "England Women",
  pakw: "Pakistan Women",
  saw: "South Africa Women",
  wiw: "West Indies Women",
  nzw: "New Zealand Women",
  slw: "Sri Lanka Women",
  banw: "Bangladesh Women",
  irew: "Ireland Women",
  sxw: "Sussex Women",
  surw: "Surrey Women",
  wsw: "Western Storm",
  lsw: "Lightning Storm Women",
  thw: "Thunder Women",
  cew: "Central Sparks",
  sew: "South East Stars",
  new: "North East Stars",
  worcs: "Worcestershire",
  som: "Somerset",
  glam: "Glamorgan",
  notts: "Nottinghamshire",
  yorks: "Yorkshire",
  lancs: "Lancashire",
  leics: "Leicestershire",
  derby: "Derbyshire",
  hants: "Hampshire",
  kent: "Kent",
  middx: "Middlesex",
  warks: "Warwickshire",
  sussex: "Sussex",
  surrey: "Surrey",
  essex: "Essex",
  durham: "Durham",
  northants: "Northamptonshire",
  gloucs: "Gloucestershire",
  hun: "Hungary",
  aut: "Austria",
  ser: "Serbia",
  bul: "Bulgaria",
  nor: "Norway",
  den: "Denmark",
  swi: "Switzerland",
  cze: "Czech Republic",
  lux: "Luxembourg",
  ger: "Germany",
  fra: "France",
  bah: "Bahamas",
  bel: "Belize",
  bra: "Brazil",
  ber: "Bermuda",
  pan: "Panama",
  lakr: "LA Knight Riders",
  sor: "San Francisco Unicorns",
  miny: "MI New York",
  txs: "Texas Super Kings",
  seatx: "Seattle Orcas",
  wash: "Washington Freedom",
};

export function expandTeamAbbr(abbr: string): string | null {
  const key = abbr.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return null;
  return SHORT_CODE_MAP[key] ?? null;
}

export function expandTeamShortCode(name: string): string {
  const t = name.trim();
  if (!t) return t;
  const key = t.toLowerCase().replace(/[^a-z]/g, "");
  if (SHORT_CODE_MAP[key]) return SHORT_CODE_MAP[key]!;
  return t;
}

export function teamSlug(name: string): string {
  return expandTeamShortCode(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 14);
}
