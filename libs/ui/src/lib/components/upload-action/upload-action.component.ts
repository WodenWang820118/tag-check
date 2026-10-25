import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * The upload button of tag-build; emits `uploadClick`.
 */
@Component({
  selector: 'lib-upload-action',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <button
      i18n="@@uploadActionComponentUploadButton"
      mat-stroked-button
      (click)="onUploadClick()"
      class="functional-card__actions__item"
    >
      Upload
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class UploadActionComponent {
  uploadClick = output<void>();

  onUploadClick() {
    this.uploadClick.emit();
  }
}
