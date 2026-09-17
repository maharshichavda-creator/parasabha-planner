import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DashboardService } from '../../core/services/dashboard.service';
import { MonthlyDashboard, MonthlyMandalStat, MonthlySwamiStat } from '../../core/models';

/** Formats a Date as a local yyyy-MM string, matching a native `<input type="month">` value. */
function toMonthIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Parses a yyyy-MM string into a local Date on the 1st of that month. */
function fromMonthIso(monthIso: string): Date {
  const [year, month] = monthIso.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  /** Selected month as a yyyy-MM string - also the exact format a native month input uses. */
  readonly selectedMonth = signal(toMonthIso(new Date()));
  readonly currentMonth = toMonthIso(new Date());
  readonly isCurrentMonth = computed(() => this.selectedMonth() === this.currentMonth);

  readonly dashboard = signal<MonthlyDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly swamiStats = computed<MonthlySwamiStat[]>(() => this.dashboard()?.swamiStats ?? []);
  readonly mandalStats = computed<MonthlyMandalStat[]>(() => this.dashboard()?.mandalStats ?? []);

  readonly maxSwamiCount = computed(() => Math.max(1, ...this.swamiStats().map((s) => s.visitCount)));
  readonly maxMandalCount = computed(() => Math.max(1, ...this.mandalStats().map((m) => m.visitCount)));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.monthly(this.selectedMonth()).subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load monthly statistics. Please make sure the backend is running.');
        this.loading.set(false);
      }
    });
  }

  previousMonth(): void {
    const current = fromMonthIso(this.selectedMonth());
    current.setMonth(current.getMonth() - 1);
    this.selectedMonth.set(toMonthIso(current));
    this.load();
  }

  nextMonth(): void {
    const current = fromMonthIso(this.selectedMonth());
    current.setMonth(current.getMonth() + 1);
    this.selectedMonth.set(toMonthIso(current));
    this.load();
  }

  goToCurrentMonth(): void {
    this.selectedMonth.set(this.currentMonth);
    this.load();
  }

  onMonthPicked(value: string): void {
    if (!value) return;
    this.selectedMonth.set(value);
    this.load();
  }

  /** Bar width as a percentage of the highest count in its list - floored so small counts stay visible. */
  barWidth(count: number, max: number): string {
    return `${Math.max(6, Math.round((count / max) * 100))}%`;
  }

  rankMedal(index: number): string | null {
    return RANK_MEDALS[index] ?? null;
  }
}
