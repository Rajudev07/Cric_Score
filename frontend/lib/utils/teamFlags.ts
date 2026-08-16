const FLAGS: Record<string, string> = {
  India: "🇮🇳",
  Australia: "🇦🇺",
  England: "🇬🇧",
  Pakistan: "🇵🇰",
  "New Zealand": "🇳🇿",
  "South Africa": "🇿🇦",
  "West Indies": "🇯🇲",
  "Sri Lanka": "🇱🇰",
  Bangladesh: "🇧🇩",
  Afghanistan: "🇦🇫",
  Ireland: "🇮🇪",
  Zimbabwe: "🇿🇼",
  Netherlands: "🇳🇱",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Nepal: "🇳🇵",
  "United States": "🇺🇸",
  Namibia: "🇳🇦",
  Oman: "🇴🇲",
};

export function teamFlagEmoji(team: string): string {
  return FLAGS[team] ?? "🏏";
}
