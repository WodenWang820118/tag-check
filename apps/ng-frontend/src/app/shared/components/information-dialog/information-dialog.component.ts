import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `<div class="error-dialog">
    <h1 mat-dialog-title class="secondary">{{ data.title }}</h1>
    <div mat-dialog-content>
      <p>{{ data.contents }}</p>
    </div>
    <mat-dialog-actions>
      <button mat-raised-button class="remark" (click)="onNoClick()">
        Cancel
      </button>
      <button
        mat-raised-button
        [color]="data.actionColor || 'warn'"
        [mat-dialog-close]="data.consent"
        (click)="dialogRef.close((data.consent = true))"
      >
        {{ data.action }}
      </button>
    </mat-dialog-actions>
  </div>`,
  styles: [``],
})
export class InformationDialogComponent {
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
  ) {}

  // this will close the dialog without emitting the consent value
  onNoClick(): void {
    this.dialogRef.close();
  }
}
