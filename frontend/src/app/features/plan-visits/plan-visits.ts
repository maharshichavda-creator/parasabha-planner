import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleService } from '../../core/services/schedule.service';
import { SwamiService } from '../../core/services/swami.service';
import { SwamiVisitService } from '../../core/services/swami-visit.service';
import { ScheduleEntry, Swami, SwamiVisit, WEEKDAY_ORDER } from '../../core/models';
import {
  addDays,
  expectedDateFor,
  formatDay,
  formatWeekRange,
  getMondayOf,
  toIsoDate
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
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly weekdays = WEEKDAY_ORDER;
  readonly entries = signal<ScheduleEntry[]>([]);
  readonly swamis = signal<Swami[]>([]);
  readonly visits = signal<SwamiVisit[]>([]);
  readonly loading = signal(true);
  readonly displayedColumns = ['weekday', 'date', 'mandal', 'swamis', 'actions'];

  /** Number of weeks away from the current week (0 = this week, -1 = last week, 1 = next week, ...). */
  readonly weekOffset = signal(0);
  readonly weekStart = computed(() => addDays(getMondayOf(new Date()), this.weekOffset() * 7));
  readonly weekEnd = computed(() => addDays(this.weekStart(), 5));
  readonly weekRangeLabel = computed(() => formatWeekRange(this.weekStart(), this.weekEnd()));
  readonly isCurrentWeek = computed(() => this.weekOffset() === 0);

  readonly editingEntryId = signal<number | null>(null);
  readonly orderedSwamiIds = signal<number[]>([]);

  readonly form = this.fb.nonNullable.group({
    scheduleEntryId: [null as number | null, Validators.required]
  });

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

  readonly selectedSwamis = computed(() => {
    const swamiMap = new Map(this.swamis().map((s) => [s.id, s]));
    return this.orderedSwamiIds()
      .map((id) => swamiMap.get(id))
      .filter((s): s is Swami => !!s);
  });

  constructor() {
    this.loadStaticData();
    this.loadVisits();
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

  previousWeek(): void {
    this.weekOffset.update((offset) => offset - 1);
    this.cancelEdit();
    this.loadVisits();
  }

  nextWeek(): void {
    this.weekOffset.update((offset) => offset + 1);
    this.cancelEdit();
    this.loadVisits();
  }

  goToCurrentWeek(): void {
    this.weekOffset.set(0);
    this.cancelEdit();
    this.loadVisits();
  }

  onSwamiSelectionChange(event: MatSelectChange): void {
    const newSelection: number[] = event.value ?? [];
    const previous = this.orderedSwamiIds();
    const kept = previous.filter((id) => newSelection.includes(id));
    const added = newSelection.filter((id) => !previous.includes(id));
    this.orderedSwamiIds.set([...kept, ...added]);
  }

  removeSwami(id: number | undefined): void {
    if (id === undefined) return;
    this.orderedSwamiIds.set(this.orderedSwamiIds().filter((sId) => sId !== id));
  }

  moveSwami(index: number, direction: -1 | 1): void {
    const ids = [...this.orderedSwamiIds()];
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.orderedSwamiIds.set(ids);
  }

  startEdit(row: RowViewModel): void {
    this.editingEntryId.set(row.entry.id ?? null);
    this.form.setValue({ scheduleEntryId: row.entry.id ?? null });
    this.orderedSwamiIds.set(row.visit?.swamis.map((s) => s.id).filter((id): id is number => id !== undefined) ?? []);
  }

  cancelEdit(): void {
    this.editingEntryId.set(null);
    this.form.reset({ scheduleEntryId: null });
    this.orderedSwamiIds.set([]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const scheduleEntryId = this.form.getRawValue().scheduleEntryId as number;
    const entry = this.entries().find((e) => e.id === scheduleEntryId);
    if (!entry) return;

    const visitDate = toIsoDate(expectedDateFor(this.weekStart(), entry.weekday));

    this.swamiVisitService
      .upsert({ scheduleEntryId, visitDate, swamiIds: this.orderedSwamiIds() })
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
