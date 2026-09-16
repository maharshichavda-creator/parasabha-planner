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
  /** Ordered Sant Mandal for this visit: index 0 = P1, index 1 = P2 (both required), rest are additional. */
  swamis: Swami[];
  /** Free-text vehicle arrangement (વાહન વ્યવસ્થા) note for this visit - optional. */
  vehicleArrangement?: string;
}

export interface SwamiVisitRequest {
  scheduleEntryId: number;
  visitDate: string; // ISO yyyy-MM-dd
  /** Ordered Swami IDs: index 0 = P1, index 1 = P2 (both required), rest are additional. */
  swamiIds: number[];
  /** Free-text vehicle arrangement (વાહન વ્યવસ્થા) note for this visit - optional. */
  vehicleArrangement?: string;
}
