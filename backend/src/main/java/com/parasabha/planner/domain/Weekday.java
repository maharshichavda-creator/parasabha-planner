package com.parasabha.planner.domain;

/**
 * Days of the week used to organize the Parasabha schedule.
 * PRS represents the special additional group of mandals that is not tied to a single weekday.
 */
public enum Weekday {
    MONDAY("સોમવાર"),
    TUESDAY("મંગળવાર"),
    WEDNESDAY("બુધવાર"),
    THURSDAY("ગુરુવાર"),
    FRIDAY("શુકવાર"),
    SATURDAY("શનિવાર"),
    PRS("PRS");

    private final String displayName;

    Weekday(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
