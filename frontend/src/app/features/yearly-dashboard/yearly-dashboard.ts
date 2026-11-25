import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DashboardService } from '../../core/services/dashboard.service';
import { MonthlyMandalStat, MonthlySwamiStat, YearlyDashboard } from '../../core/models';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const YEARS_BACK = 10;
const YEARS_AHEAD = 1;

@Component({
  selector: 'app-yearly-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './yearly-dashboard.html',
  styleUrl: '../dashboard/dashboard.scss'
})
export class YearlyDashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly currentYear = new Date().getFullYear();
  readonly years = Array.from(
    { length: YEARS_BACK + YEARS_AHEAD + 1 },
    (_, i) => this.currentYear + YEARS_AHEAD - i
  );
  readonly minYear = this.years[this.years.length - 1];
  readonly maxYear = this.years[0];

  readonly selectedYear = signal(this.currentYear);
  readonly isCurrentYear = computed(() => this.selectedYear() === this.currentYear);

  readonly dashboard = signal<YearlyDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly swamiStats = computed<MonthlySwamiStat[]>(() => this.dashboard()?.swamiStats ?? []);
  readonly mandalStats = computed<MonthlyMandalStat[]>(() => this.dashboard()?.mandalStats ?? []);

  readonly maxSwamiCount = computed(() => Math.max(1, ...this.swamiStats().map((s) => s.visitCount)));
  readonly maxMandalCount = computed(() => Math.max(1, ...this.mandalStats().map((m) => m.visitCount)));
  readonly activeSwamiCount = computed(() => this.swamiStats().filter((s) => s.visitCount > 0).length);
  readonly activeMandalCount = computed(() => this.mandalStats().filter((m) => m.visitCount > 0).length);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.yearly(this.selectedYear()).subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load yearly statistics. Please make sure the backend is running.');
        this.loading.set(false);
      }
    });
  }

  previousYear(): void {
    this.onYearPicked(this.selectedYear() - 1);
  }

  nextYear(): void {
    this.onYearPicked(this.selectedYear() + 1);
  }

  goToCurrentYear(): void {
    this.onYearPicked(this.currentYear);
  }

  onYearPicked(year: number): void {
    if (!year || year < this.minYear || year > this.maxYear) return;
    this.selectedYear.set(year);
    this.load();
  }

  /** Bar width as a percentage of the highest count in its list - floored so small counts stay visible. */
  barWidth(count: number, max: number): string {
    if (count <= 0) return '0%';
    return `${Math.max(6, Math.round((count / max) * 100))}%`;
  }

  rankMedal(index: number, count: number): string | null {
    return count > 0 ? (RANK_MEDALS[index] ?? null) : null;
  }
}
