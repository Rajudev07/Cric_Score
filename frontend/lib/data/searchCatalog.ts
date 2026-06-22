/** Curated entities for instant search + fallback when API omits coverage */

export interface TeamEntity {
  id: string;
  name: string;
  shortName: string;
  /** Lowercase tokens for matching */
  keywords: string[];
}

export interface PlayerEntity {
  id: string;
  name: string;
  team: string;
  role: "Batter" | "Bowler" | "All-rounder" | "WK-Batter";
  /** Cricket Data player id when known — enables /player/[id] deep links */
  apiPid?: string;
  battingAvg?: string;
  strikeRate?: string;
  economy?: string;
  wickets?: string;
  bio?: string;
}

export const teamCatalog: TeamEntity[] = [
  {
    id: "csk",
    name: "Chennai Super Kings",
    shortName: "CSK",
    keywords: ["chennai", "csk", "super kings"],
  },
  {
    id: "mi",
    name: "Mumbai Indians",
    shortName: "MI",
    keywords: ["mumbai", "mi", "indians"],
  },
  {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    keywords: ["rcb", "bengaluru", "bangalore", "royal challengers"],
  },
  {
    id: "kkr",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    keywords: ["kolkata", "kkr", "knight riders"],
  },
  {
    id: "dc",
    name: "Delhi Capitals",
    shortName: "DC",
    keywords: ["delhi", "dc", "capitals"],
  },
  {
    id: "srh",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    keywords: ["hyderabad", "srh", "sunrisers"],
  },
  {
    id: "rr",
    name: "Rajasthan Royals",
    shortName: "RR",
    keywords: ["rajasthan", "rr", "royals"],
  },
  {
    id: "pbks",
    name: "Punjab Kings",
    shortName: "PBKS",
    keywords: ["punjab", "pbks", "kings"],
  },
  {
    id: "lsg",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    keywords: ["lucknow", "lsg", "super giants"],
  },
  {
    id: "gt",
    name: "Gujarat Titans",
    shortName: "GT",
    keywords: ["gujarat", "gt", "titans"],
  },
  {
    id: "india",
    name: "India",
    shortName: "IND",
    keywords: ["india", "men in blue", "team india", "ind"],
  },
  {
    id: "australia",
    name: "Australia",
    shortName: "AUS",
    keywords: ["australia", "aus", "aussies"],
  },
  {
    id: "england",
    name: "England",
    shortName: "ENG",
    keywords: ["england", "eng"],
  },
  {
    id: "pakistan",
    name: "Pakistan",
    shortName: "PAK",
    keywords: ["pakistan", "pak"],
  },
];

export const playerCatalog: PlayerEntity[] = [
  {
    id: "virat-kohli",
    name: "Virat Kohli",
    team: "India / RCB",
    role: "Batter",
    battingAvg: "48.2",
    strikeRate: "138.5",
    bio: "Modern-era batting great; aggressive top-order anchor with elite chase record.",
  },
  {
    id: "rohit-sharma",
    name: "Rohit Sharma",
    team: "India / MI",
    role: "Batter",
    battingAvg: "41.0",
    strikeRate: "132.0",
    bio: "Explosive opener; multiple double hundreds in ODIs.",
  },
  {
    id: "jasprit-bumrah",
    name: "Jasprit Bumrah",
    team: "India / MI",
    role: "Bowler",
    economy: "6.8",
    wickets: "150+ intl.",
    bio: "Yorker specialist; unmatched death-overs control at peak.",
  },
  {
    id: "ms-dhoni",
    name: "MS Dhoni",
    team: "CSK",
    role: "WK-Batter",
    battingAvg: "38.1",
    strikeRate: "126.1",
    bio: "Finisher and captaincy legend; ice-cool under pressure.",
  },
  {
    id: "ben-stokes",
    name: "Ben Stokes",
    team: "England",
    role: "All-rounder",
    battingAvg: "34.5",
    strikeRate: "125.0",
    economy: "7.2",
    wickets: "100+ test",
    bio: "Match-winner with bat and ball; clutch performances in ICC events.",
  },
];

export const teamSquads: Record<string, string[]> = {
  csk: [
    "Ruturaj Gaikwad",
    "Devon Conway",
    "Ajinkya Rahane",
    "Shivam Dube",
    "Ravindra Jadeja",
    "MS Dhoni",
    "Deepak Chahar",
    "Tushar Deshpande",
    "Maheesh Theekshana",
    "Matheesha Pathirana",
  ],
  mi: [
    "Rohit Sharma",
    "Ishan Kishan",
    "Suryakumar Yadav",
    "Tilak Varma",
    "Hardik Pandya",
    "Tim David",
    "Jasprit Bumrah",
    "Piyush Chawla",
    "Gerald Coetzee",
  ],
  rcb: [
    "Faf du Plessis",
    "Virat Kohli",
    "Glenn Maxwell",
    "Cameron Green",
    "Dinesh Karthik",
    "Mohammed Siraj",
    "Josh Hazlewood",
  ],
};

export function getTeamById(id: string): TeamEntity | undefined {
  const slug = id.trim().toLowerCase();
  return teamCatalog.find((t) => t.id === slug);
}

export function getPlayerCatalogById(id: string): PlayerEntity | undefined {
  const slug = id.trim().toLowerCase();
  return playerCatalog.find((p) => p.id === slug);
}

export function getPlayerCatalogByPid(pid: string): PlayerEntity | undefined {
  return playerCatalog.find((p) => p.apiPid === pid);
}
