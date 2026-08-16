/** Last manual update — ICC official player rankings (public). */
export const ICC_RANKINGS_UPDATED_AT = "2026-08-10T00:00:00.000Z";

export interface IccRankingEntry {
  rank: number;
  player: string;
  team: string;
  rating: number;
}

export type IccFormat = "test" | "odi" | "t20i";
export type IccCategory = "batting" | "bowling";

type IccRankingsShape = Record<
  IccFormat,
  Record<IccCategory, IccRankingEntry[]>
>;

function rows(
  data: [number, string, string, number][]
): IccRankingEntry[] {
  return data.map(([rank, player, team, rating]) => ({
    rank,
    player,
    team,
    rating,
  }));
}

export const iccRankings: IccRankingsShape = {
  test: {
    batting: rows([
      [1, "Kane Williamson", "New Zealand", 932],
      [2, "Steve Smith", "Australia", 928],
      [3, "Ben Stokes", "England", 915],
      [4, "Travis Head", "Australia", 914],
      [5, "Rishabh Pant", "India", 912],
      [6, "Babar Azam", "Pakistan", 899],
      [7, "Marnus Labuschagne", "Australia", 888],
      [8, "Joe Root", "England", 886],
      [9, "Usman Khawaja", "Australia", 881],
      [10, "Shubman Gill", "India", 879],
      [11, "Virat Kohli", "India", 877],
      [12, "Dhananjaya de Silva", "Sri Lanka", 865],
      [13, "Tom Latham", "New Zealand", 858],
      [14, "Najmul Hossain Shanto", "Bangladesh", 855],
      [15, "Kraigg Brathwaite", "West Indies", 848],
      [16, "Dimuth Karunaratne", "Sri Lanka", 845],
      [17, "Temba Bavuma", "South Africa", 842],
      [18, "Shreyas Iyer", "India", 838],
      [19, "Dean Elgar", "South Africa", 832],
      [20, "Zak Crawley", "England", 828],
    ]),
    bowling: rows([
      [1, "Jasprit Bumrah", "India", 896],
      [2, "Pat Cummins", "Australia", 887],
      [3, "Scott Boland", "Australia", 878],
      [4, "Mitchell Starc", "Australia", 867],
      [5, "Shaheen Afridi", "Pakistan", 862],
      [6, "Kagiso Rabada", "South Africa", 856],
      [7, "Mohammed Shami", "India", 851],
      [8, "Ravindra Jadeja", "India", 847],
      [9, "Ravichandran Ashwin", "India", 842],
      [10, "Mitchell Santner", "New Zealand", 838],
      [11, "Nathan Lyon", "Australia", 835],
      [12, "Mark Wood", "England", 832],
      [13, "Kuldeep Yadav", "India", 828],
      [14, "Trent Boult", "New Zealand", 825],
      [15, "Mohammed Siraj", "India", 822],
      [16, "Kemar Roach", "West Indies", 818],
      [17, "Marco Jansen", "South Africa", 815],
      [18, "Chris Woakes", "England", 812],
      [19, "Matt Henry", "New Zealand", 808],
      [20, "Jaydev Unadkat", "India", 805],
    ]),
  },
  odi: {
    batting: rows([
      [1, "Babar Azam", "Pakistan", 889],
      [2, "Rishabh Pant", "India", 867],
      [3, "Travis Head", "Australia", 865],
      [4, "Shubman Gill", "India", 862],
      [5, "Virat Kohli", "India", 859],
      [6, "Rohit Sharma", "India", 854],
      [7, "Shai Hope", "West Indies", 848],
      [8, "Ibrahim Zadran", "Afghanistan", 847],
      [9, "Kane Williamson", "New Zealand", 845],
      [10, "Temba Bavuma", "South Africa", 842],
      [11, "Quinton de Kock", "South Africa", 838],
      [12, "Fakhar Zaman", "Pakistan", 835],
      [13, "Jos Buttler", "England", 832],
      [14, "Heinrich Klaasen", "South Africa", 829],
      [15, "Litton Das", "Bangladesh", 825],
      [16, "Charith Asalanka", "Sri Lanka", 822],
      [17, "Pathum Nissanka", "Sri Lanka", 818],
      [18, "Imam-ul-Haq", "Pakistan", 815],
      [19, "Shreyas Iyer", "India", 812],
      [20, "Daryl Mitchell", "New Zealand", 805],
    ]),
    bowling: rows([
      [1, "Jasprit Bumrah", "India", 856],
      [2, "Josh Hazlewood", "Australia", 848],
      [3, "Mohammad Nabi", "Afghanistan", 842],
      [4, "Rashid Khan", "Afghanistan", 838],
      [5, "Mustafizur Rahman", "Bangladesh", 835],
      [6, "Mitchell Starc", "Australia", 832],
      [7, "Trent Boult", "New Zealand", 828],
      [8, "Shaheen Afridi", "Pakistan", 825],
      [9, "Kuldeep Yadav", "India", 822],
      [10, "Adam Zampa", "Australia", 818],
      [11, "Shakib Al Hasan", "Bangladesh", 815],
      [12, "Wanindu Hasaranga", "Sri Lanka", 812],
      [13, "Kagiso Rabada", "South Africa", 808],
      [14, "Mohammed Shami", "India", 805],
      [15, "Axar Patel", "India", 802],
      [16, "Adil Rashid", "England", 798],
      [17, "Haris Rauf", "Pakistan", 795],
      [18, "Lockie Ferguson", "New Zealand", 792],
      [19, "Matt Henry", "New Zealand", 788],
      [20, "Mark Wood", "England", 785],
    ]),
  },
  t20i: {
    batting: rows([
      [1, "Suryakumar Yadav", "India", 879],
      [2, "Travis Head", "Australia", 855],
      [3, "Dawid Malan", "England", 842],
      [4, "Shubman Gill", "India", 841],
      [5, "Mohammad Rizwan", "Pakistan", 839],
      [6, "Rilee Rossouw", "South Africa", 836],
      [7, "Virat Kohli", "India", 834],
      [8, "Babar Azam", "Pakistan", 832],
      [9, "Jos Buttler", "England", 829],
      [10, "Finn Allen", "New Zealand", 825],
      [11, "Pathum Nissanka", "Sri Lanka", 822],
      [12, "Heinrich Klaasen", "South Africa", 818],
      [13, "Devon Conway", "New Zealand", 815],
      [14, "Quinton de Kock", "South Africa", 812],
      [15, "Tilak Varma", "India", 808],
      [16, "Ishan Kishan", "India", 805],
      [17, "Nicholas Pooran", "West Indies", 802],
      [18, "Daryl Mitchell", "New Zealand", 799],
      [19, "Rahmanullah Gurbaz", "Afghanistan", 796],
      [20, "Rinku Singh", "India", 790],
    ]),
    bowling: rows([
      [1, "Rashid Khan", "Afghanistan", 892],
      [2, "Josh Hazlewood", "Australia", 865],
      [3, "Adam Zampa", "Australia", 858],
      [4, "Jasprit Bumrah", "India", 855],
      [5, "Kuldeep Yadav", "India", 848],
      [6, "Mitchell Santner", "New Zealand", 842],
      [7, "Shaheen Afridi", "Pakistan", 838],
      [8, "Wanindu Hasaranga", "Sri Lanka", 835],
      [9, "Mohammad Nabi", "Afghanistan", 832],
      [10, "Haris Rauf", "Pakistan", 828],
      [11, "Axar Patel", "India", 825],
      [12, "Lockie Ferguson", "New Zealand", 822],
      [13, "Kagiso Rabada", "South Africa", 818],
      [14, "Mark Wood", "England", 815],
      [15, "Mustafizur Rahman", "Bangladesh", 812],
      [16, "Trent Boult", "New Zealand", 808],
      [17, "Chris Jordan", "England", 805],
      [18, "Lungi Ngidi", "South Africa", 802],
      [19, "Matt Henry", "New Zealand", 798],
      [20, "Arshdeep Singh", "India", 795],
    ]),
  },
};
