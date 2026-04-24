import {
  Component,
  inject,
  input,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { TagBuildMode } from '@data-access';
import { FunctionalCardFacade } from './functional-card.facade.service';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-functional-card',
  standalone: true,
  imports: [MatButtonModule, AdvancedExpansionPanelComponent],
  templateUrl: './functional-card.component.html',
  styleUrls: ['./functional-card.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FunctionalCardComponent {
  private readonly facade = inject(FunctionalCardFacade);
  accordionContainer =
    viewChild.required<AdvancedExpansionPanelComponent>('accordionContainer');
  color = input<string>('primary');
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
    this.facade.convertCode(this.accordionContainer);
  }
}
