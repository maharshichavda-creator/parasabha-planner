import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleService } from '../../core/services/schedule.service';
import { MandalService } from '../../core/services/mandal.service';
import { Mandal, ScheduleEntry, WEEKDAY_LABELS, WEEKDAY_ORDER, Weekday } from '../../core/models';

@Component({
  selector: 'app-mandal-schedule',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './mandal-schedule.html',
  styleUrl: './mandal-schedule.scss'
})
export class MandalScheduleComponent {
  private readonly scheduleService = inject(ScheduleService);
  private readonly mandalService = inject(MandalService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly weekdays = WEEKDAY_ORDER;
  readonly weekdayLabels = WEEKDAY_LABELS;

  readonly entries = signal<ScheduleEntry[]>([]);
  readonly mandals = signal<Mandal[]>([]);
  readonly loading = signal(true);
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['weekday', 'mandal', 'sortOrder', 'actions'];

  readonly sortedEntries = computed(() =>
    [...this.entries()].sort((a, b) => {
      const dayDiff = this.weekdays.indexOf(a.weekday) - this.weekdays.indexOf(b.weekday);
      if (dayDiff !== 0) return dayDiff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
  );

  readonly form = this.fb.nonNullable.group({
    weekday: ['MONDAY' as Weekday, Validators.required],
    mandalId: [null as number | null, Validators.required],
    sortOrder: [null as number | null]
  });

  constructor() {
    this.loadMandals();
    this.load();
  }

  loadMandals(): void {
    this.mandalService.list().subscribe({
      next: (mandals) => this.mandals.set([...mandals].sort((a, b) => a.name.localeCompare(b.name))),
      error: () => this.snackBar.open('Failed to load mandals', 'Dismiss', { duration: 4000 })
    });
  }

  load(): void {
    this.loading.set(true);
    this.scheduleService.list().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load mandal schedule', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  startEdit(entry: ScheduleEntry): void {
    this.editingId.set(entry.id ?? null);
    this.form.setValue({
      weekday: entry.weekday,
      mandalId: entry.mandalId,
      sortOrder: entry.sortOrder ?? null
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ weekday: 'MONDAY', mandalId: null, sortOrder: null });
  }

  weekdayLabel(weekday: Weekday): string {
    return this.weekdayLabels[weekday];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request = {
      weekday: value.weekday,
      mandalId: value.mandalId as number,
      sortOrder: value.sortOrder ?? undefined
    };
    const editingId = this.editingId();

    const request$ = editingId ? this.scheduleService.update(editingId, request) : this.scheduleService.create(request);

    request$.subscribe({
      next: () => {
        this.snackBar.open(editingId ? 'Mandal schedule updated' : 'Mandal added to schedule', 'Dismiss', {
          duration: 3000
        });
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Something went wrong', 'Dismiss', { duration: 4000 });
      }
    });
  }

  remove(entry: ScheduleEntry): void {
    if (!entry.id) return;
    if (
      !confirm(
        `Remove "${entry.mandalName}" from ${this.weekdayLabels[entry.weekday]}? This also clears any planned visits for this slot.`
      )
    ) {
      return;
    }

    this.scheduleService.delete(entry.id).subscribe({
      next: () => {
        this.snackBar.open('Removed from schedule', 'Dismiss', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Could not remove schedule entry', 'Dismiss', { duration: 4000 });
      }
    });
  }
}
