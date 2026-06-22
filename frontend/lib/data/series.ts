export type PointsTableRow = {
  team: string;
  played: number;
  won: number;
  lost: number;
  nr: number;
  nrr: string;
  points: number;
};

export type SeriesPointsTable = {
  rows: PointsTableRow[];
  /** Top N teams qualify (highlight line) */
  qualifyCount?: number;
};

export type SeriesTopPerformer = {
  name: string;
  value: number;
  label: string;
};
