import { Weekday } from './weekday.model';
import { ScheduleEntry } from './schedule-entry.model';

export interface WeeklyScheduleDay {
  weekday: Weekday;
  weekdayLabel: string;
  entries: ScheduleEntry[];
}
