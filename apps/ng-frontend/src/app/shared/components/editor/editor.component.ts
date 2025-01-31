import {
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  effect,
  input,
  viewChild
} from '@angular/core';
import {
  EditorExtension,
  EditorService
} from '../../services/editor/editor.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  template: `
    <div class="root-wrapper">
      <div id="cm-editor" #editor></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent {
  editorExtension = input.required<EditorExtension>();
  content = input.required<string>();
  editMode = input<boolean>(false);

  private editor = viewChild<ElementRef<HTMLDivElement>>('editor');

  constructor(private readonly editorService: EditorService) {
    // Handle content changes
    effect(() => {
      const content = this.content();
      const editorElement = this.editor();
      if (editorElement && content && !this.editMode()) {
        this.initializeEditor();
      }
    });
  }

  private initializeEditor() {
    const editorElement = this.editor();
    if (editorElement) {
      this.editorService.initEditorView(
        this.editorExtension(),
        editorElement,
        this.content()
      );
    }
  }
}
