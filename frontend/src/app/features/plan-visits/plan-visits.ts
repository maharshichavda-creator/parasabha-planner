import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleService } from '../../core/services/schedule.service';
import { SwamiService } from '../../core/services/swami.service';
import { SwamiVisitService } from '../../core/services/swami-visit.service';
import { WeeklyTopicService } from '../../core/services/weekly-topic.service';
import { ScheduleEntry, Swami, SwamiVisit, Weekday, WEEKDAY_LABELS, WEEKDAY_ORDER } from '../../core/models';
import {
  addDays,
  expectedDateFor,
  formatDay,
  formatWeekRange,
  fromIsoDate,
  getMondayOf,
  toIsoDate,
  weekdayForDate
} from '../../core/utils/week.util';

interface RowViewModel {
  entry: ScheduleEntry;
  dateLabel: string;
  visit?: SwamiVisit;
}

@Component({
  selector: 'app-plan-visits',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './plan-visits.html',
  styleUrl: './plan-visits.scss'
})
export class PlanVisitsComponent {
  private readonly scheduleService = inject(ScheduleService);
  private readonly swamiService = inject(SwamiService);
  private readonly swamiVisitService = inject(SwamiVisitService);
  private readonly weeklyTopicService = inject(WeeklyTopicService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly weekdays = WEEKDAY_ORDER;
  readonly entries = signal<ScheduleEntry[]>([]);
  readonly swamis = signal<Swami[]>([]);
  readonly visits = signal<SwamiVisit[]>([]);
  readonly loading = signal(true);
  readonly displayedColumns = ['weekday', 'date', 'mandal', 'swamis', 'vehicle', 'actions'];

  /** Number of weeks away from the current week (0 = this week, -1 = last week, 1 = next week, ...). */
  readonly weekOffset = signal(0);
  readonly weekStart = computed(() => addDays(getMondayOf(new Date()), this.weekOffset() * 7));
  readonly weekEnd = computed(() => addDays(this.weekStart(), 5));
  readonly weekRangeLabel = computed(() => formatWeekRange(this.weekStart(), this.weekEnd()));
  readonly isCurrentWeek = computed(() => this.weekOffset() === 0);

  readonly editingEntryId = signal<number | null>(null);
  /** Order of any Sant Mandal beyond the mandatory P1/P2 pair. */
  readonly orderedAdditionalIds = signal<number[]>([]);

  /** Day options (Monday..Saturday) a PRS mandal's visit can be assigned to for display purposes. */
  readonly prsWeekdayOptions = WEEKDAY_ORDER.filter((w): w is Weekday => w !== 'PRS');
  readonly weekdayLabels = WEEKDAY_LABELS;

  /** Gujarati label for a weekday, used in the grid columns. */
  weekdayLabel(weekday: Weekday): string {
    return WEEKDAY_LABELS[weekday];
  }

  readonly form = this.fb.nonNullable.group({
    scheduleEntryId: [null as number | null, Validators.required],
    p1SwamiId: [null as number | null],
    p2SwamiId: [null as number | null, Validators.required],
    vehicleArrangement: [''],
    /** Which Mon-Sat day this visit should be shown under on the weekly screen - only used
     * (and required) when the selected schedule slot is a PRS mandal. */
    prsWeekday: [null as Weekday | null]
  });

  /** Tracks the selected schedule slot as a signal so PRS-specific UI reacts reliably to form changes. */
  readonly selectedEntryId = signal<number | null>(null);
  readonly selectedEntry = computed(() => this.entries().find((e) => e.id === this.selectedEntryId()) ?? null);
  readonly isPrsEntrySelected = computed(() => this.selectedEntry()?.weekday === 'PRS');

  /** P1/P2 પ્રવચન વિષય (discourse topic) + link plan for the current week - one record per week. */
  readonly topicForm = this.fb.nonNullable.group({
    p1Topic: [''],
    p1Link: [''],
    p2Topic: [''],
    p2Link: ['']
  });
  readonly loadingTopic = signal(true);
  readonly savingTopic = signal(false);

  readonly rows = computed<RowViewModel[]>(() => {
    const weekStart = this.weekStart();
    const visitsByEntryId = new Map(this.visits().map((v) => [v.scheduleEntryId, v]));

    return [...this.entries()]
      .sort((a, b) => {
        const dayDiff = this.weekdays.indexOf(a.weekday) - this.weekdays.indexOf(b.weekday);
        if (dayDiff !== 0) return dayDiff;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      })
      .map((entry) => ({
        entry,
        dateLabel: formatDay(expectedDateFor(weekStart, entry.weekday)),
        visit: entry.id !== undefined ? visitsByEntryId.get(entry.id) : undefined
      }));
  });

  readonly additionalSwamis = computed(() => {
    const swamiMap = new Map(this.swamis().map((s) => [s.id, s]));
    return this.orderedAdditionalIds()
      .map((id) => swamiMap.get(id))
      .filter((s): s is Swami => !!s);
  });

  /** Swamis available for the P1 dropdown: everyone except whoever is currently P2. */
  readonly p1Options = computed(() => {
    const p2 = this.form.controls.p2SwamiId.value;
    return this.swamis().filter((s) => s.id !== p2);
  });

  /** Swamis available for the P2 dropdown: everyone except whoever is currently P1. */
  readonly p2Options = computed(() => {
    const p1 = this.form.controls.p1SwamiId.value;
    return this.swamis().filter((s) => s.id !== p1);
  });

  /** Swamis available for the "additional" multi-select: everyone except P1 and P2. */
  readonly additionalOptions = computed(() => {
    const p1 = this.form.controls.p1SwamiId.value;
    const p2 = this.form.controls.p2SwamiId.value;
    return this.swamis().filter((s) => s.id !== p1 && s.id !== p2);
  });

  constructor() {
    this.loadStaticData();
    this.loadVisits();
    this.loadTopic();
    this.form.controls.scheduleEntryId.valueChanges.subscribe((id) => this.selectedEntryId.set(id));
  }

  loadStaticData(): void {
    this.scheduleService.list().subscribe((entries) => this.entries.set(entries));
    this.swamiService.list().subscribe((swamis) => this.swamis.set(swamis));
  }

  loadVisits(): void {
    this.loading.set(true);
    this.swamiVisitService.listForWeek(toIsoDate(this.weekStart())).subscribe({
      next: (visits) => {
        this.visits.set(visits);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load planned visits', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  loadTopic(): void {
    this.loadingTopic.set(true);
    this.weeklyTopicService.getForWeek(toIsoDate(this.weekStart())).subscribe({
      next: (topic) => {
        this.topicForm.reset({
          p1Topic: topic.p1Topic ?? '',
          p1Link: topic.p1Link ?? '',
          p2Topic: topic.p2Topic ?? '',
          p2Link: topic.p2Link ?? ''
        });
        this.loadingTopic.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load પ્રવચન વિષય for this week', 'Dismiss', { duration: 4000 });
        this.loadingTopic.set(false);
      }
    });
  }

  saveTopic(): void {
    const value = this.topicForm.getRawValue();
    this.savingTopic.set(true);
    this.weeklyTopicService
      .upsert({
        weekStart: toIsoDate(this.weekStart()),
        p1Topic: value.p1Topic.trim() || undefined,
        p1Link: value.p1Link.trim() || undefined,
        p2Topic: value.p2Topic.trim() || undefined,
        p2Link: value.p2Link.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.snackBar.open('પ્રવચન વિષય saved', 'Dismiss', { duration: 3000 });
          this.savingTopic.set(false);
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message ?? 'Could not save પ્રવચન વિષય', 'Dismiss', { duration: 4000 });
          this.savingTopic.set(false);
        }
      });
  }

  previousWeek(): void {
    this.weekOffset.update((offset) => offset - 1);
    this.cancelEdit();
    this.loadVisits();
    this.loadTopic();
  }

  nextWeek(): void {
    this.weekOffset.update((offset) => offset + 1);
    this.cancelEdit();
    this.loadVisits();
    this.loadTopic();
  }

  goToCurrentWeek(): void {
    this.weekOffset.set(0);
    this.cancelEdit();
    this.loadVisits();
    this.loadTopic();
  }

  onAdditionalSelectionChange(event: MatSelectChange): void {
    const newSelection: number[] = event.value ?? [];
    const previous = this.orderedAdditionalIds();
    const kept = previous.filter((id) => newSelection.includes(id));
    const added = newSelection.filter((id) => !previous.includes(id));
    this.orderedAdditionalIds.set([...kept, ...added]);
  }

  removeAdditionalSwami(id: number | undefined): void {
    if (id === undefined) return;
    this.orderedAdditionalIds.set(this.orderedAdditionalIds().filter((sId) => sId !== id));
  }

  moveAdditionalSwami(index: number, direction: -1 | 1): void {
    const ids = [...this.orderedAdditionalIds()];
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.orderedAdditionalIds.set(ids);
  }

  swamiName(id: number | undefined): string | null {
    if (id === undefined) return null;
    return this.swamis().find((s) => s.id === id)?.name ?? null;
  }

  startEdit(row: RowViewModel): void {
    const swamis = row.visit?.swamis ?? [];
    const hasP1 = swamis.length > 1;
    const prsWeekday =
      row.entry.weekday === 'PRS' && row.visit
        ? weekdayForDate(this.weekStart(), fromIsoDate(row.visit.visitDate))
        : null;
    this.editingEntryId.set(row.entry.id ?? null);
    this.form.setValue({
      scheduleEntryId: row.entry.id ?? null,
      p1SwamiId: hasP1 ? swamis[0]?.id ?? null : null,
      p2SwamiId: (hasP1 ? swamis[1]?.id : swamis[0]?.id) ?? null,
      vehicleArrangement: row.visit?.vehicleArrangement ?? '',
      prsWeekday
    });
    this.orderedAdditionalIds.set(
      (hasP1 ? swamis.slice(2) : [])
        .map((s) => s.id)
        .filter((id): id is number => id !== undefined)
    );
  }

  cancelEdit(): void {
    this.editingEntryId.set(null);
    this.form.reset({ scheduleEntryId: null, p1SwamiId: null, p2SwamiId: null, vehicleArrangement: '', prsWeekday: null });
    this.orderedAdditionalIds.set([]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('P2 is required to save the plan', 'Dismiss', { duration: 4000 });
      return;
    }
    const value = this.form.getRawValue();
    const entry = this.entries().find((e) => e.id === value.scheduleEntryId);
    if (!entry) return;

    if (entry.weekday === 'PRS' && !value.prsWeekday) {
      this.form.controls.prsWeekday.markAsTouched();
      this.snackBar.open('Please select a day for this PRS mandal', 'Dismiss', { duration: 4000 });
      return;
    }

    const displayWeekday = entry.weekday === 'PRS' ? (value.prsWeekday as Weekday) : entry.weekday;
    const visitDate = toIsoDate(expectedDateFor(this.weekStart(), displayWeekday));
    // P1 is optional: only include it when chosen, otherwise the visit starts with P2.
    const swamiIds = value.p1SwamiId
      ? [value.p1SwamiId, value.p2SwamiId as number, ...this.orderedAdditionalIds()]
      : [value.p2SwamiId as number, ...this.orderedAdditionalIds()];
    const vehicleArrangement = value.vehicleArrangement?.trim() || undefined;

    this.swamiVisitService
      .upsert({ scheduleEntryId: value.scheduleEntryId as number, visitDate, swamiIds, vehicleArrangement })
      .subscribe({
        next: () => {
          this.snackBar.open('Swami visit planned', 'Dismiss', { duration: 3000 });
          this.cancelEdit();
          this.loadVisits();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message ?? 'Something went wrong', 'Dismiss', { duration: 4000 });
        }
      });
  }

  clear(row: RowViewModel): void {
    if (!row.visit?.id) return;
    if (!confirm(`Clear the planned visit for ${row.entry.mandalName} on ${row.dateLabel}?`)) return;

    this.swamiVisitService.delete(row.visit.id).subscribe({
      next: () => {
        this.snackBar.open('Planned visit cleared', 'Dismiss', { duration: 3000 });
        this.loadVisits();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Could not clear visit', 'Dismiss', { duration: 4000 });
      }
    });
  }
}
