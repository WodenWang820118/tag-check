import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [SharedModule],
  template: `<div class="error-dialog">
    <h1 mat-dialog-title>Error</h1>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        Close
      </button>
    </div>
  </div>`,
  styles: [``],
})
export class ErrorDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
