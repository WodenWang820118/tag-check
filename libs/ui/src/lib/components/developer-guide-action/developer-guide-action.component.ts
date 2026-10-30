import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * The "For developers" action button of tag-build; opens the developer snippets dialog.
 */
@Component({
  selector: 'lib-developer-guide-action',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './developer-guide-action.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class DeveloperGuideActionComponent {
  guideClick = output<void>();

  onGuideClick() {
    this.guideClick.emit();
  }
}
