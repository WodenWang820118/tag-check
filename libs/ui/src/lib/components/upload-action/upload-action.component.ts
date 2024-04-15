import { Component, EventEmitter, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'lib-upload-action',
  standalone: true,
  imports: [SharedModule],
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
