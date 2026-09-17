import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScheduleService } from '../../core/services/schedule.service';
import { WeeklyTopicService } from '../../core/services/weekly-topic.service';
import { ScheduleEntry, WeeklyScheduleDay, WeeklyTopic } from '../../core/models';
import { addDays, dateForWeekday, formatDay, formatWeekRange, getMondayOf, toIsoDate } from '../../core/utils/week.util';

@Component({
  selector: 'app-weekly-report',
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
  templateUrl: './weekly-report.html',
  styleUrl: './weekly-report.scss'
})
export class WeeklyReportComponent {
  private readonly scheduleService = inject(ScheduleService);
  private readonly weeklyTopicService = inject(WeeklyTopicService);

  readonly reportSheet = viewChild<ElementRef<HTMLElement>>('reportSheet');

  readonly days = signal<WeeklyScheduleDay[]>([]);
  readonly topic = signal<WeeklyTopic | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloadingPdf = signal(false);

  /** Number of weeks away from the current week (0 = this week, -1 = last week, 1 = next week, ...). */
  readonly weekOffset = signal(0);
  readonly weekStart = computed(() => addDays(getMondayOf(new Date()), this.weekOffset() * 7));
  readonly weekEnd = computed(() => addDays(this.weekStart(), 5));
  readonly weekRangeLabel = computed(() => formatWeekRange(this.weekStart(), this.weekEnd()));
  readonly isCurrentWeek = computed(() => this.weekOffset() === 0);
  readonly startDateIso = computed(() => toIsoDate(this.weekStart()));
  readonly endDateIso = computed(() => toIsoDate(this.weekEnd()));

  readonly hasTopic = computed(() => {
    const t = this.topic();
    return !!t && !!(t.p1Topic || t.p1Link || t.p2Topic || t.p2Link);
  });

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
        this.error.set('Could not load the schedule. Please make sure the backend is running.');
        this.loading.set(false);
      }
    });
    this.weeklyTopicService.getForWeek(toIsoDate(this.weekStart())).subscribe({
      next: (topic) => this.topic.set(topic),
      error: () => this.topic.set(null)
    });
  }

  dateLabelFor(day: WeeklyScheduleDay): string | null {
    const date = dateForWeekday(this.weekStart(), day.weekday);
    return date ? formatDay(date) : null;
  }

  /**
   * Encoding: a single planned Swami IS P2 (P1 left blank); with two or more planned,
   * index 0 is P1 and index 1 is P2, with any further entries being extra Sant Mandal.
   */
  p1Name(entry: ScheduleEntry): string | null {
    return entry.swamis.length > 1 ? (entry.swamis[0]?.name ?? null) : null;
  }

  p2Name(entry: ScheduleEntry): string | null {
    if (entry.swamis.length === 0) return null;
    return entry.swamis.length > 1 ? (entry.swamis[1]?.name ?? null) : (entry.swamis[0]?.name ?? null);
  }

  /** Any Sant Mandal beyond P1/P2 for this entry, comma-joined. */
  additionalNames(entry: ScheduleEntry): string | null {
    const extra = entry.swamis.length > 2 ? entry.swamis.slice(2) : [];
    return extra.length > 0 ? extra.map((s) => s.name).join(', ') : null;
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

  onDatePicked(value: string): void {
    if (!value) return;
    const [year, month, day] = value.split('-').map(Number);
    const picked = new Date(year, month - 1, day);
    const pickedMonday = getMondayOf(picked);
    const currentMonday = getMondayOf(new Date());
    const diffWeeks = Math.round((pickedMonday.getTime() - currentMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    this.weekOffset.set(diffWeeks);
    this.load();
  }

  async downloadPdf(): Promise<void> {
    const element = this.reportSheet()?.nativeElement;
    if (!element || this.downloadingPdf()) {
      return;
    }

    this.downloadingPdf.set(true);
    element.classList.add('pdf-capturing');
    try {
      // Lazy-loaded so these libraries don't add to the initial app bundle.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      // JPEG keeps the exported file lightweight while staying crisp for text.
      const imageQuality = 0.85;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
      const margin = 24;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      // Scale the whole capture to the page's usable width, then split it into as many
      // page-height slices as needed so long reports flow across multiple pages instead
      // of being squeezed onto (or overflowing) a single one.
      const scaleFactor = usableWidth / canvas.width;
      const pageSliceHeightPx = Math.floor(usableHeight / scaleFactor);

      let renderedHeightPx = 0;
      let isFirstPage = true;
      while (renderedHeightPx < canvas.height) {
        const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - renderedHeightPx);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, renderedHeightPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

        const imageData = sliceCanvas.toDataURL('image/jpeg', imageQuality);
        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imageData, 'JPEG', margin, margin, usableWidth, sliceHeightPx * scaleFactor);

        renderedHeightPx += sliceHeightPx;
        isFirstPage = false;
      }

      pdf.save(`parasabha-report-${this.startDateIso()}-to-${this.endDateIso()}.pdf`);
    } finally {
      this.downloadingPdf.set(false);
      element.classList.remove('pdf-capturing');
    }
  }
}
