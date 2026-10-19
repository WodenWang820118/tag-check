import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'lib-error-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `<div class="error-dialog">
    <h1 mat-dialog-title>Error</h1>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        Close
      </button>
    </div>
  </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [``]
})
export class ErrorDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
