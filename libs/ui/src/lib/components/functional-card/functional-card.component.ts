import {
  Component,
  inject,
  input,
  viewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy
} from '@angular/core';
import { TagBuildMode } from '@data-access';
import type { ProjectContainerImport } from '../conversion-success-dialog/conversion-success-dialog.component';
import { FunctionalCardFacade } from './functional-card.facade.service';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';
import { MatButtonModule } from '@angular/material/button';

/**
 * The card with tag-build's Convert button and the import readiness of
 * the last conversion.
 */
@Component({
  selector: 'lib-functional-card',
  standalone: true,
  imports: [MatButtonModule, AdvancedExpansionPanelComponent],
  templateUrl: './functional-card.component.html',
  styleUrls: ['./functional-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class FunctionalCardComponent {
  private readonly facade = inject(FunctionalCardFacade);
  accordionContainer =
    viewChild.required<AdvancedExpansionPanelComponent>('accordionContainer');
  color = input<string>('primary');
  projectSlug = input<string>();
  /**
   * Host hook for importing the built container. Null on the standalone
   * site; TagCheck sets it. Read when Convert is clicked, so a hook that
   * arrives with the project is the one the dialog uses.
   */
  projectImport = input<ProjectContainerImport | null>(null);
  readonly isConvertDisabled$ = this.facade.isConvertDisabled$;
  readonly importReadiness = this.facade.importReadiness;
  readonly importReadinessLabel = this.facade.importReadinessLabel;

  get mode() {
    return this.facade.mode;
  }

  get tagBuildModeEnum() {
    return TagBuildMode;
  }

  convertCode() {
    this.facade.convertCode(
      this.accordionContainer,
      this.projectSlug(),
      this.projectImport()
    );
  }
}
