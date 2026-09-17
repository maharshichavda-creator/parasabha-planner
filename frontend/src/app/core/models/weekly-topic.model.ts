/** The P1/P2 પ્રવચન વિષય (discourse topic) planned for a given week, plus an optional link for each. */
export interface WeeklyTopic {
  id?: number;
  weekStart: string; // ISO yyyy-MM-dd (Monday of the week)
  /** P1 (પ્રથમ સંત) પ્રવચન વિષય - optional. */
  p1Topic?: string;
  /** Link (e.g. recording/reference) for the P1 પ્રવચન - optional. */
  p1Link?: string;
  /** P2 (દ્વિતીય સંત) પ્રવચન વિષય - optional. */
  p2Topic?: string;
  /** Link (e.g. recording/reference) for the P2 પ્રવચન - optional. */
  p2Link?: string;
}

export interface WeeklyTopicRequest {
  weekStart: string; // ISO yyyy-MM-dd (any day within the desired week; server snaps to Monday)
  p1Topic?: string;
  p1Link?: string;
  p2Topic?: string;
  p2Link?: string;
}
