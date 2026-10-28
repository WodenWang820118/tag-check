import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * The "For developers" action button of tag-build; opens the developer snippets dialog.
 */
@Component({
  selector: 'lib-developer-guide-action',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <button
      i18n="@@developerGuideActionComponentButton"
      mat-stroked-button
      type="button"
      (click)="onGuideClick()"
      class="functional-card__actions__item"
      data-testid="tagbuild-developer-guide"
    >
      For developers
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class DeveloperGuideActionComponent {
  guideClick = output<void>();

  onGuideClick() {
    this.guideClick.emit();
  }
}
