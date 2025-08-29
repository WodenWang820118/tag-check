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
  template: `<div class="cm-editor" #editor></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent {
  // Make the extension required so we don't initialize with a wrong default
  editorExtension = input.required<EditorTypeEnum>();
  content = input<string>('');
  editorElement = viewChild<ElementRef<HTMLDivElement>>('editor');

  constructor(private readonly editorService: EditorService) {
    // Initialize editor only when the element and extension are available.
    // Avoid reading `content()` here so this effect doesn't re-run on content changes.
    effect(() => {
      const element = this.editorElement();
      const extension = this.editorExtension();
      if (element && extension) {
        this.editorService.initEditorView(extension, element);
      }
    });

    // Separate effect to update content without re-initializing the editor
    effect(() => {
      const extension = this.editorExtension();
      const content = this.content();
      if (extension && content?.length) {
        this.editorService.setContent(extension, content);
      }
    });
  }
}
