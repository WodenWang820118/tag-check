import {
  Component,
  computed,
  effect,
  input,
  signal,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  EditorFacadeService,
  TagBuildMode,
  TagBuildModeService
} from '@data-access';
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
  accordionContainer =
    viewChild.required<AdvancedExpansionPanelComponent>('accordionContainer');
  color = input<string>('primary');
  private readonly dataLayer: Array<Record<string, unknown>>;
  private readonly isConvertDisabled = signal<boolean>(true);
  isConvertDisabled$ = computed(() => {
    const inputJson = this.editorFacadeService.inputJsonContent();
    // disable when empty
    if (!inputJson && this.isConvertDisabled()) return true;

    // try to parse valid JSON; if invalid, disable
    try {
      const parsed = JSON.parse(inputJson);
      if (Array.isArray(parsed)) {
        return parsed.length === 0;
      }
      if (parsed && typeof parsed === 'object') {
        return Object.keys(parsed).length === 0;
      }
      // for primitives (string/number/etc), consider non-empty as enabled
      return false;
    } catch (e) {
      // invalid JSON -> disable
      console.warn('isConvertDisabled: invalid JSON', e);
      return true;
    }
  });

  constructor(
    public editorFacadeService: EditorFacadeService,
    private readonly tagBuildModeService: TagBuildModeService,
    private readonly facade: FunctionalCardFacade
  ) {
    const dl = (
      window as unknown as { dataLayer?: Array<Record<string, unknown>> }
    ).dataLayer;
    this.dataLayer = dl ?? [];

    effect(() => {
      const inputContent = this.editorFacadeService.inputJsonContent();
      try {
        const inputContentObj = JSON.parse(inputContent);
        if (inputContentObj.length > 0) {
          console.log('input content exists: ', inputContent);
          this.isConvertDisabled.set(false);
        }
      } catch (error) {
        // Invalid JSON, do nothing or handle as needed
        console.warn('Invalid JSON in effect:', error);
      }
    });
  }

  get mode() {
    return this.tagBuildModeService.mode;
  }

  get tagBuildModeEnum() {
    return TagBuildMode;
  }

  convertCode() {
    this.facade.convertCode(this.accordionContainer);
  }

  // conversion logic moved to `FunctionalCardFacade`

  scrollToBottom() {
    try {
      // small helper to scroll drawer to bottom
      const element = document.querySelector('.mat-drawer-content');
      if (element) {
        if (element.scrollHeight === element.clientHeight) {
          return;
        }
        element.scrollTo({
          top: element.scrollHeight - element.clientHeight,
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
}
