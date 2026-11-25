import { MonthlyMandalStat, MonthlySwamiStat } from './monthly-dashboard.model';

/** Aggregated Swami-visit statistics for a single calendar year. */
export interface YearlyDashboard {
  year: number;
  totalVisits: number;
  /** Per-Swami visit counts, ranked highest first. */
  swamiStats: MonthlySwamiStat[];
  /** Per-Mandal visit counts, ranked highest first. */
  mandalStats: MonthlyMandalStat[];
}
