package com.parasabha.planner.util;

import com.parasabha.planner.domain.Weekday;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

/** Helpers for mapping a Weekday to an actual calendar date within a given week. */
public final class WeekUtil {

    private static final Map<Weekday, Integer> WEEKDAY_OFFSET = new EnumMap<>(Weekday.class);
    private static final Map<Integer, Weekday> OFFSET_TO_WEEKDAY = new HashMap<>();

    static {
        WEEKDAY_OFFSET.put(Weekday.MONDAY, 0);
        WEEKDAY_OFFSET.put(Weekday.TUESDAY, 1);
        WEEKDAY_OFFSET.put(Weekday.WEDNESDAY, 2);
        WEEKDAY_OFFSET.put(Weekday.THURSDAY, 3);
        WEEKDAY_OFFSET.put(Weekday.FRIDAY, 4);
        WEEKDAY_OFFSET.put(Weekday.SATURDAY, 5);
        // PRS has no fixed weekday; visits for it are keyed by whichever day was chosen for them.
        WEEKDAY_OFFSET.forEach((weekday, offset) -> OFFSET_TO_WEEKDAY.put(offset, weekday));
    }

    private WeekUtil() {
    }

    /** Returns the Monday of the week containing the given date. */
    public static LocalDate mondayOf(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    /**
     * The exact calendar date a given weekday's slot falls on within the week starting
     * {@code weekStart} (which must be a Monday). PRS entries are keyed to the Monday itself
     * since they aren't tied to one specific weekday.
     */
    public static LocalDate expectedDate(LocalDate weekStart, Weekday weekday) {
        Integer offset = WEEKDAY_OFFSET.get(weekday);
        return offset == null ? weekStart : weekStart.plusDays(offset);
    }

    /**
     * The inverse of {@link #expectedDate}: which Monday-Saturday Weekday a calendar date falls
     * on within the week starting {@code weekStart}. Returns null if the date isn't a Mon-Sat
     * day within that week (used to place a PRS visit under the day its Swami visit actually
     * fell on).
     */
    public static Weekday weekdayForDate(LocalDate weekStart, LocalDate date) {
        long offset = ChronoUnit.DAYS.between(weekStart, date);
        return OFFSET_TO_WEEKDAY.get((int) offset);
    }

    /** Last date (inclusive) of the Mon-Sat span used by the weekly grid. */
    public static LocalDate weekEnd(LocalDate weekStart) {
        return weekStart.plusDays(5);
    }
}
