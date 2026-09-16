package com.parasabha.planner.seed;

import com.parasabha.planner.domain.Mandal;
import com.parasabha.planner.domain.ScheduleEntry;
import com.parasabha.planner.domain.Swami;
import com.parasabha.planner.domain.Weekday;
import com.parasabha.planner.repository.MandalRepository;
import com.parasabha.planner.repository.ScheduleEntryRepository;
import com.parasabha.planner.repository.SwamiRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with the initial weekly Parasabha schedule (source: Parasabha_Planner.xlsx)
 * on first startup only - it never overwrites existing data.
 *
 * <p>This seeds the recurring Mandal + Weekday template and the known Swami (Sant Mandal)
 * roster, but does NOT plan any Swami visits: which Swami (if any) actually visits a Mandal
 * is planned per calendar week via the "Plan Swami Visits" feature and starts out blank.
 */
@Component
@RequiredArgsConstructor
public class ScheduleDataSeeder implements CommandLineRunner {

    private final MandalRepository mandalRepository;
    private final SwamiRepository swamiRepository;
    private final ScheduleEntryRepository scheduleEntryRepository;

    private final Map<String, Swami> swamiCache = new LinkedHashMap<>();

    @Override
    public void run(String... args) {
        if (scheduleEntryRepository.count() > 0) {
            return;
        }

        seedDay(Weekday.MONDAY, List.of(
                row("કર્વનગર", true),
                row("પેઠ", false)
        ));

        seedDay(Weekday.TUESDAY, List.of(
                row("નીગડી", false)
        ));

        seedDay(Weekday.WEDNESDAY, List.of(
                row("બાલાજીનગર", false, "પૂ. મુનિરત્ન સ્વામી", "પૂ. ત્યાગાનંદ સ્વામી"),
                row("બાલેવાડી", false),
                row("સાંગવી", false),
                row("સિંહગડ", false, "પૂ. ગુરુપ્રીય સ્વામી", "પૂ. આત્મસ્વરૂપ સ્વામી"),
                row("પીપરી", false, "પૂ. મુનિરત્ન સ્વામી", "પૂ. ત્યાગાનંદ સ્વામી")
        ));

        seedDay(Weekday.THURSDAY, List.of(
                row("તલેગાંવ", false),
                row("આંબેગાવ", false, "પૂ. ગુરુપ્રીય સ્વામી", "પૂ. આત્મસ્વરૂપ સ્વામી"),
                row("કોથરુડ", false, "પૂ. નારાયણસેતુ સ્વામી", "પૂ. યોગર્ષિ સ્વામી"),
                row("માર્કેટયાર્ડ", false, "પૂ. નારાયણસેતુ સ્વામી", "પૂ. શાસ્ત્રોનયન સ્વામી")
        ));

        seedDay(Weekday.FRIDAY, List.of(
                row("તાથવડે", true),
                row("NIBM", false, "પૂ. નિર્દોષનયન સ્વામી", "પૂ. યોગર્ષિ સ્વામી"),
                row("વાકડ", false),
                row("હડપસર", false, "પૂ. નારાયણસેતુ સ્વામી", "પૂ. યોગર્ષિ સ્વામી"),
                row("ધાયરી", false)
        ));

        seedDay(Weekday.SATURDAY, List.of(
                row("હિંજેવાડી", true),
                row("કલ્યાણીનગર", false),
                row("વાઘોલી", false, "પૂ. મુનિરત્ન સ્વામી", "પૂ. ત્યાગાનંદ સ્વામી"),
                row("વુડસવિલે", true)
        ));

        seedDay(Weekday.PRS, List.of(
                row("લોહેગાંવ", false),
                row("વિવા સરોવર", false),
                row("દત્તનગર", false),
                row("શિવણે", false),
                row("ખરાડી", false),
                row("બાલાજીનગર", false)
        ));
    }

    /** Swami names here seed the known Sant Mandal roster only - they are NOT auto-assigned. */
    private SeedRow row(String mandalName, boolean pr, String... swamiNames) {
        return new SeedRow(mandalName, pr, List.of(swamiNames));
    }

    private void seedDay(Weekday weekday, List<SeedRow> rows) {
        int sortOrder = 0;
        for (SeedRow row : rows) {
            Mandal mandal = mandalRepository.findByNameIgnoreCase(row.mandalName())
                    .orElseGet(() -> mandalRepository.save(Mandal.builder().name(row.mandalName()).pr(row.pr()).build()));

            ScheduleEntry entry = ScheduleEntry.builder()
                    .weekday(weekday)
                    .mandal(mandal)
                    .sortOrder(sortOrder++)
                    .build();
            scheduleEntryRepository.save(entry);

            // Ensure the Swami roster exists so it's ready to be picked when planning visits,
            // even though no visit is planned automatically.
            for (String swamiName : row.swamiNames()) {
                swamiCache.computeIfAbsent(swamiName, name ->
                        swamiRepository.findByNameIgnoreCase(name)
                                .orElseGet(() -> swamiRepository.save(Swami.builder().name(name).build())));
            }
        }
    }

    private record SeedRow(String mandalName, boolean pr, List<String> swamiNames) {
    }
}
