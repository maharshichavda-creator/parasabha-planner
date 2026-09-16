import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
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

  readonly printArea = viewChild<ElementRef<HTMLElement>>('printArea');

  readonly days = signal<WeeklyScheduleDay[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloadingPdf = signal(false);

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

  async downloadPdf(): Promise<void> {
    const element = this.printArea()?.nativeElement;
    if (!element || this.downloadingPdf()) {
      return;
    }

    this.downloadingPdf.set(true);
    // Flatten card shadows while capturing: shadows are expensive to compress and add
    // no value on paper, so dropping them keeps the exported file small.
    element.classList.add('pdf-capturing');
    try {
      // Lazy-loaded so these libraries don't add to the initial app bundle.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

      const canvas = await html2canvas(element, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      // JPEG at a high quality keeps the file lightweight while staying crisp for text.
      const imageData = canvas.toDataURL('image/jpeg', 0.82);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
      const margin = 24;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imageHeight;
      let offsetY = margin;

      pdf.addImage(imageData, 'JPEG', margin, offsetY, usableWidth, imageHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        offsetY = margin - (imageHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imageData, 'JPEG', margin, offsetY, usableWidth, imageHeight);
        heightLeft -= usableHeight;
      }

      pdf.save(`parasabha-schedule-${toIsoDate(this.weekStart())}.pdf`);
    } finally {
      this.downloadingPdf.set(false);
      element.classList.remove('pdf-capturing');
    }
  }
}
