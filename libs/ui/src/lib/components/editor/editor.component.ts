import {
  Component,
  ElementRef,
  input,
  ChangeDetectionStrategy,
  effect,
  viewChild
} from '@angular/core';
import { EditorService } from '@data-access';
import { EditorTypeEnum } from '@utils';

@Component({
  selector: 'lib-editor',
  standalone: true,
  styles: [``],
  template: `<div id="cm-editor" #editor></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent {
  editorExtension = input<EditorTypeEnum>(EditorTypeEnum.INPUT_JSON);
  content = input<string>('');
  editorElement = viewChild<ElementRef<HTMLDivElement>>('editor');

  constructor(private readonly editorService: EditorService) {
    // Use effect to handle editor initialization
    effect(() => {
      // Get the current value of the editor element
      const element = this.editorElement();

      // Only initialize if element exists
      if (element) {
        this.editorService.initEditorView(
          this.editorExtension(),
          element,
          this.content()
        );
      }
    });
  }
}
