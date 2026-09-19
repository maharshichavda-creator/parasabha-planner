import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { jsPDF } from 'jspdf';
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
  private readonly snackBar = inject(MatSnackBar);

  readonly reportSheet = viewChild<ElementRef<HTMLElement>>('reportSheet');
  readonly p1LinkAnchor = viewChild<ElementRef<HTMLAnchorElement>>('p1LinkAnchor');
  readonly p2LinkAnchor = viewChild<ElementRef<HTMLAnchorElement>>('p2LinkAnchor');

  readonly days = signal<WeeklyScheduleDay[]>([]);
  readonly topic = signal<WeeklyTopic | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloadingPdf = signal(false);
  readonly sharingWhatsApp = signal(false);

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

  /** Report should only surface mandals that actually have a P1 and/or P2 Sant Mandal planned. */
  readonly reportDays = computed(() =>
    this.days().map((day) => ({
      ...day,
      entries: day.entries.filter((entry) => entry.swamis.length > 0)
    }))
  );

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
    if (this.downloadingPdf() || this.sharingWhatsApp()) {
      return;
    }
    this.downloadingPdf.set(true);
    try {
      const result = await this.generateReportPdf();
      result?.pdf.save(result.fileName);
    } finally {
      this.downloadingPdf.set(false);
    }
  }

  /**
   * WhatsApp's wa.me links can only pre-fill a chat with text - they cannot attach a file for
   * security/privacy reasons, so the PDF is downloaded first (same as "Download PDF") and the
   * user is prompted to attach that just-downloaded file once the WhatsApp chat opens.
   */
  async shareOnWhatsApp(): Promise<void> {
    if (this.downloadingPdf() || this.sharingWhatsApp()) {
      return;
    }
    this.sharingWhatsApp.set(true);
    try {
      const result = await this.generateReportPdf();
      if (!result) return;
      result.pdf.save(result.fileName);

      this.snackBar.open(`PDF downloaded as "${result.fileName}" - attach it in the WhatsApp chat that just opened.`, 'Dismiss', {
        duration: 6000
      });

      const message = `Parasabha - સાપ્તાહિક આયોજન (${this.weekRangeLabel()})\nPDF attached: ${result.fileName}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    } finally {
      this.sharingWhatsApp.set(false);
    }
  }

  private async generateReportPdf(): Promise<{ pdf: jsPDF; fileName: string } | null> {
    const element = this.reportSheet()?.nativeElement;
    if (!element) {
      return null;
    }

    element.classList.add('pdf-capturing');
    try {
      // Rasterizing the sheet into an image (below) loses the P1/P2 "Link" anchors' clickable
      // behaviour, so capture their on-screen positions first (in un-scaled canvas px, relative
      // to the sheet's top-left corner) and re-attach them as real PDF link annotations afterwards.
      const captureScale = 2;
      const sheetRect = element.getBoundingClientRect();
      const linkTargets: { url: string; canvasRect: { x: number; y: number; width: number; height: number } }[] = [];
      const collectLinkTarget = (anchor: ElementRef<HTMLAnchorElement> | undefined, url: string | null | undefined): void => {
        const anchorEl = anchor?.nativeElement;
        if (!anchorEl || !url) return;
        const r = anchorEl.getBoundingClientRect();
        linkTargets.push({
          url,
          canvasRect: {
            x: (r.left - sheetRect.left) * captureScale,
            y: (r.top - sheetRect.top) * captureScale,
            width: r.width * captureScale,
            height: r.height * captureScale
          }
        });
      };
      collectLinkTarget(this.p1LinkAnchor(), this.topic()?.p1Link);
      collectLinkTarget(this.p2LinkAnchor(), this.topic()?.p2Link);

      // Lazy-loaded so these libraries don't add to the initial app bundle.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

      const canvas = await html2canvas(element, {
        scale: captureScale,
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

        // Re-attach any topic links that fall within this page's slice as clickable annotations,
        // positioned over the exact spot where the rasterized "Link" text was drawn.
        const sliceStartPx = renderedHeightPx;
        const sliceEndPx = renderedHeightPx + sliceHeightPx;
        for (const target of linkTargets) {
          if (target.canvasRect.y + target.canvasRect.height <= sliceStartPx || target.canvasRect.y >= sliceEndPx) {
            continue;
          }
          pdf.link(
            margin + target.canvasRect.x * scaleFactor,
            margin + (target.canvasRect.y - sliceStartPx) * scaleFactor,
            target.canvasRect.width * scaleFactor,
            target.canvasRect.height * scaleFactor,
            { url: target.url }
          );
        }

        renderedHeightPx += sliceHeightPx;
        isFirstPage = false;
      }

      return { pdf, fileName: `parasabha-plan-${this.startDateIso()}-to-${this.endDateIso()}.pdf` };
    } finally {
      element.classList.remove('pdf-capturing');
    }
  }
}
