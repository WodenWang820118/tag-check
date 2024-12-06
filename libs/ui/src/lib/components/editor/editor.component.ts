import {
  Component,
  ElementRef,
  input,
  ChangeDetectionStrategy,
  effect,
  viewChild
} from '@angular/core';
import { EditorExtension, EditorService } from '@data-access';

@Component({
  selector: 'lib-editor',
  standalone: true,
  styles: [``],
  template: `<div id="cm-editor" #editor></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent {
  editorExtension = input<EditorExtension>('inputJson');
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
