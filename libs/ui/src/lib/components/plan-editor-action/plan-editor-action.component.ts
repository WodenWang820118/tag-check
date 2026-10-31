import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * The "Write plan" action button of tag-build; emits `planClick`.
 */
@Component({
  selector: 'lib-plan-editor-action',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './plan-editor-action.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class PlanEditorActionComponent {
  planClick = output<void>();

  onPlanClick(): void {
    this.planClick.emit();
  }
}
