export type Weekday = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'PRS';

export const WEEKDAY_ORDER: Weekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'PRS'
];

/** Gujarati display labels for each weekday, mirroring the backend Weekday enum. */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: 'સોમવાર',
  TUESDAY: 'મંગળવાર',
  WEDNESDAY: 'બુધવાર',
  THURSDAY: 'ગુરુવાર',
  FRIDAY: 'શુકવાર',
  SATURDAY: 'શનિવાર',
  PRS: 'PRS'
};
