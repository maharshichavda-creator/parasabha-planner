import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScheduleService } from '../../core/services/schedule.service';
import { WeeklyScheduleDay } from '../../core/models';
import { addDays, dateForWeekday, formatDay, formatWeekRange, getMondayOf, toIsoDate } from '../../core/utils/week.util';

@Component({
  selector: 'app-weekly-schedule',
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './weekly-schedule.html',
  styleUrl: './weekly-schedule.scss'
})
export class WeeklyScheduleComponent {
  private readonly scheduleService = inject(ScheduleService);

  readonly days = signal<WeeklyScheduleDay[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Number of weeks away from the current week (0 = this week, -1 = last week, 1 = next week, ...). */
  readonly weekOffset = signal(0);

  readonly weekStart = computed(() => addDays(getMondayOf(new Date()), this.weekOffset() * 7));
  readonly weekEnd = computed(() => addDays(this.weekStart(), 5));
  readonly weekRangeLabel = computed(() => formatWeekRange(this.weekStart(), this.weekEnd()));
  readonly isCurrentWeek = computed(() => this.weekOffset() === 0);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.scheduleService.weekly(toIsoDate(this.weekStart())).subscribe({
      next: (days) => {
        this.days.set(days);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the weekly schedule. Please make sure the backend is running.');
        this.loading.set(false);
      }
    });
  }

  dateLabelFor(day: WeeklyScheduleDay): string | null {
    const date = dateForWeekday(this.weekStart(), day.weekday);
    return date ? formatDay(date) : null;
  }

  previousWeek(): void {
    this.weekOffset.update((offset) => offset - 1);
    this.load();
  }

  nextWeek(): void {
    this.weekOffset.update((offset) => offset + 1);
    this.load();
  }

  goToCurrentWeek(): void {
    this.weekOffset.set(0);
    this.load();
  }
}
