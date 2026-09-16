import { Weekday } from '../models';

/** Returns the Monday of the week that contains the given date (local time, time stripped to midnight). */
export function getMondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Maps MONDAY..SATURDAY to an offset from the week's Monday. PRS has no fixed calendar day. */
const WEEKDAY_OFFSET: Partial<Record<Weekday, number>> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5
};

export function dateForWeekday(weekStart: Date, weekday: Weekday): Date | null {
  const offset = WEEKDAY_OFFSET[weekday];
  return offset === undefined ? null : addDays(weekStart, offset);
}

/**
 * Like dateForWeekday, but never returns null: PRS (which has no fixed weekday) is keyed to
 * the week's Monday itself. Must mirror the backend's WeekUtil.expectedDate exactly, since
 * this is the date used to plan/look up a Swami visit for a given week.
 */
export function expectedDateFor(weekStart: Date, weekday: Weekday): Date {
  return dateForWeekday(weekStart, weekday) ?? weekStart;
}

/**
 * Inverse of dateForWeekday: which MONDAY..SATURDAY weekday a date falls on within the week
 * starting weekStart. Returns null if the date isn't a Mon-Sat day within that week (mirrors
 * the backend's WeekUtil.weekdayForDate). Used to figure out which day a PRS visit was
 * planned for, since PRS entries don't have a fixed weekday of their own.
 */
export function weekdayForDate(weekStart: Date, date: Date): Weekday | null {
  const diffDays = Math.round((date.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
  const entry = Object.entries(WEEKDAY_OFFSET).find(([, offset]) => offset === diffDays);
  return (entry?.[0] as Weekday | undefined) ?? null;
}

/** Parses an ISO yyyy-MM-dd string (as returned by the API) into a local Date at midnight. */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const RANGE_FORMATTER = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const RANGE_FORMATTER_WITH_YEAR = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const DAY_FORMATTER = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  const startLabel = sameYear ? RANGE_FORMATTER.format(weekStart) : RANGE_FORMATTER_WITH_YEAR.format(weekStart);
  const endLabel = RANGE_FORMATTER_WITH_YEAR.format(weekEnd);
  return `${startLabel} – ${endLabel}`;
}

export function formatDay(date: Date): string {
  return DAY_FORMATTER.format(date);
}

/** Formats a Date as a local yyyy-MM-dd string (avoids UTC/timezone shifting from toISOString()). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
