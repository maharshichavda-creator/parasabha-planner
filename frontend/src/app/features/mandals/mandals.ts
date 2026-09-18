import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MandalService } from '../../core/services/mandal.service';
import { Mandal } from '../../core/models';

@Component({
  selector: 'app-mandals',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './mandals.html',
  styleUrl: './mandals.scss'
})
export class MandalsComponent {
  private readonly mandalService = inject(MandalService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly mandals = signal<Mandal[]>([]);
  readonly loading = signal(true);
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['name', 'pr', 'prs', 'actions'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    pr: [false],
    prs: [false]
  });

  constructor() {
    this.load();
  }

  /** Sort order for the mandal category: regular first, then PR, then PRS. */
  private categoryRank(mandal: Mandal): number {
    if (mandal.prs) return 2;
    if (mandal.pr) return 1;
    return 0;
  }

  load(): void {
    this.loading.set(true);
    this.mandalService.list().subscribe({
      next: (mandals) => {
        this.mandals.set(
          [...mandals].sort(
            (a, b) => this.categoryRank(a) - this.categoryRank(b) || a.name.localeCompare(b.name)
          )
        );
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load mandals', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  startEdit(mandal: Mandal): void {
    this.editingId.set(mandal.id ?? null);
    this.form.setValue({ name: mandal.name, pr: mandal.pr, prs: mandal.prs });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', pr: false, prs: false });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const editingId = this.editingId();

    const request$ = editingId
      ? this.mandalService.update(editingId, value)
      : this.mandalService.create(value);

    request$.subscribe({
      next: () => {
        this.snackBar.open(editingId ? 'Mandal updated' : 'Mandal added', 'Dismiss', { duration: 3000 });
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Something went wrong', 'Dismiss', { duration: 4000 });
      }
    });
  }

  remove(mandal: Mandal): void {
    if (!mandal.id) return;
    if (!confirm(`Delete mandal "${mandal.name}"? This also removes its schedule entries.`)) return;

    this.mandalService.delete(mandal.id).subscribe({
      next: () => {
        this.snackBar.open('Mandal deleted', 'Dismiss', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Could not delete mandal', 'Dismiss', { duration: 4000 });
      }
    });
  }
}
