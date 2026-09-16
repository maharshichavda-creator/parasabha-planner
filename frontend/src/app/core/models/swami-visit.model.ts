import { Weekday } from './weekday.model';
import { Swami } from './swami.model';

/** A planned Swami visit for a specific calendar date - not recurring. */
export interface SwamiVisit {
  id?: number;
  visitDate: string; // ISO yyyy-MM-dd
  scheduleEntryId: number;
  weekday?: Weekday;
  weekdayLabel?: string;
  mandalId?: number;
  mandalName?: string;
  mandalPr?: boolean;
  swamis: Swami[];
}

export interface SwamiVisitRequest {
  scheduleEntryId: number;
  visitDate: string; // ISO yyyy-MM-dd
  swamiIds: number[];
}
