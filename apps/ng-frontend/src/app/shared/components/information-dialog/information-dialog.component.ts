import { Component, Inject, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div
      class="error-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <h1 mat-dialog-title class="secondary" id="dialog-title" tabindex="-1">
        {{ data.title }}
      </h1>
      <div mat-dialog-content id="dialog-description" class="dialog-content">
        <p>{{ data.contents }}</p>
      </div>
      <mat-dialog-actions align="end">
        <button
          mat-raised-button
          type="button"
          class="remark"
          (click)="handleCancel()"
          aria-label="Cancel dialog"
        >
          Cancel
        </button>
        <button
          mat-raised-button
          type="button"
          [color]="data.actionColor || 'warn'"
          (click)="handleConfirm()"
          [attr.aria-label]="data.action + ' and close dialog'"
        >
          {{ data.action }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .error-dialog {
        padding: 1rem;
        max-width: 500px;
        width: 100%;
      }

      .dialog-content {
        margin: 1rem 0;
      }

      mat-dialog-actions {
        margin-top: 1rem;
        gap: 0.5rem;
      }
    `
  ]
})
export class InformationDialogComponent {
  private readonly dialogState = signal<{
    isClosing: boolean;
    result: boolean | null;
  }>({ isClosing: false, result: null });

  constructor(
    public dialogRef: MatDialogRef<InformationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      contents: string;
      action: string;
      actionColor: string;
      consent: boolean;
    }
  ) {
    // Handle dialog state changes
    effect(() => {
      const state = this.dialogState();
      if (state.isClosing) {
        this.cleanupAndClose(state.result);
      }
    });
  }

  handleCancel(): void {
    this.dialogState.set({ isClosing: true, result: false });
  }

  handleConfirm(): void {
    this.dialogState.set({ isClosing: true, result: true });
  }

  private cleanupAndClose(result: boolean | null): void {
    // Remove inert and aria-hidden from main content
    const mainContent = document.querySelector('app-root');
    if (mainContent) {
      mainContent.removeAttribute('inert');
      mainContent.removeAttribute('aria-hidden');
    }
    // Close dialog with result
    this.dialogRef.close(result);
  }
}
