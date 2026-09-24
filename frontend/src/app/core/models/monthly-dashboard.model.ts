/** How many Mandal visits a given Swami led within a selected month. */
export interface MonthlySwamiStat {
  swamiId: number;
  swamiName: string;
  visitCount: number;
}

/** How many times a given Mandal was visited by a Swami within a selected month. */
export interface MonthlyMandalStat {
  mandalId: number;
  mandalName: string;
  mandalPr: boolean;
  mandalYuvak: boolean;
  /** True if any of this Mandal's visits in the month were planned under the special PRS group. */
  prs: boolean;
  visitCount: number;
}

/** Aggregated Swami-visit statistics for a single calendar month. */
export interface MonthlyDashboard {
  /** ISO year-month, e.g. "2026-09". */
  month: string;
  /** Human-friendly label, e.g. "September 2026". */
  monthLabel: string;
  totalVisits: number;
  /** Per-Swami visit counts, ranked highest first. */
  swamiStats: MonthlySwamiStat[];
  /** Per-Mandal visit counts, ranked highest first. */
  mandalStats: MonthlyMandalStat[];
}
