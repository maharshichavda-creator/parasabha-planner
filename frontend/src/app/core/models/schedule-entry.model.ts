import { Weekday } from './weekday.model';
import { Swami } from './swami.model';

export interface ScheduleEntry {
  id?: number;
  weekday: Weekday;
  weekdayLabel?: string;
  sortOrder?: number;
  mandalId: number;
  mandalName?: string;
  mandalPr?: boolean;
  swamis: Swami[];
}

export interface ScheduleEntryRequest {
  weekday: Weekday;
  mandalId: number;
  sortOrder?: number;
}
