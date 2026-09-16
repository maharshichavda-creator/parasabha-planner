import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwamiService } from '../../core/services/swami.service';
import { Swami } from '../../core/models';

@Component({
  selector: 'app-swamis',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './swamis.html',
  styleUrl: './swamis.scss'
})
export class SwamisComponent {
  private readonly swamiService = inject(SwamiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly swamis = signal<Swami[]>([]);
  readonly loading = signal(true);
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['name', 'actions'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]]
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.swamiService.list().subscribe({
      next: (swamis) => {
        this.swamis.set([...swamis].sort((a, b) => a.name.localeCompare(b.name)));
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load Sant Mandal list', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  startEdit(swami: Swami): void {
    this.editingId.set(swami.id ?? null);
    this.form.setValue({ name: swami.name });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const editingId = this.editingId();

    const request$ = editingId ? this.swamiService.update(editingId, value) : this.swamiService.create(value);

    request$.subscribe({
      next: () => {
        this.snackBar.open(editingId ? 'Swami updated' : 'Swami added', 'Dismiss', { duration: 3000 });
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Something went wrong', 'Dismiss', { duration: 4000 });
      }
    });
  }

  remove(swami: Swami): void {
    if (!swami.id) return;
    if (!confirm(`Remove "${swami.name}" from the Sant Mandal list? This also removes them from any schedule entries.`)) {
      return;
    }

    this.swamiService.delete(swami.id).subscribe({
      next: () => {
        this.snackBar.open('Swami removed', 'Dismiss', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Could not remove swami', 'Dismiss', { duration: 4000 });
      }
    });
  }
}
