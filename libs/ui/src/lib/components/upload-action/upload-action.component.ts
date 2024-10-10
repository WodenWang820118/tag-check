import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-upload-action',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <button
      mat-stroked-button
      (click)="onUploadClick()"
      class="functional-card__actions__item"
    >
      Upload
    </button>
  `,
  styles: [],
})
export class UploadActionComponent {
  @Output() uploadClick = new EventEmitter<void>();

  onUploadClick() {
    this.uploadClick.emit();
  }
}
