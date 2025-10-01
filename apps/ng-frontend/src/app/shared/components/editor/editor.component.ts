import {
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  effect,
  input,
  viewChild,
  computed,
  OnDestroy
} from '@angular/core';
import {
  EditorExtension,
  EditorService,
  EditorThemeStyles
} from '../../services/editor/editor.service';
import { EditorView } from '@codemirror/view';

@Component({
  selector: 'app-editor',
  standalone: true,
  template: `
    <div class="root-wrapper">
      <div id="cm-editor" #editor role="textbox" aria-label="Code editor"></div>
    </div>
  `,
  styles: [
    // Make the host accept height from utility classes and let inner elements stretch
    ':host { display: block; }',
    '.root-wrapper { height: 100%; }',
    '#cm-editor { height: 100%; }'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent implements OnDestroy {
  editorExtension = input.required<EditorExtension>();
  editMode = input<boolean>(false);
  content = input<string>();
  stylesOverride = input<EditorThemeStyles | undefined>(undefined);
  private readonly editorContent = computed(() => {
    const content = this.content();
    return content;
  });
  private readonly editor = viewChild<ElementRef<HTMLDivElement>>('editor');
  private editorView: EditorView | null = null;

  constructor(private readonly editorService: EditorService) {
    effect(() => {
      const content = this.editorContent();
      const editorElement = this.editor();
      if (editorElement && content) {
        if (this.editorView) {
          // Update existing editor content
          const transaction = this.editorView.state.update({
            changes: {
              from: 0,
              to: this.editorView.state.doc.length,
              insert: content
            }
          });
          this.editorView.dispatch(transaction);
        } else {
          this.editorView = this.editorService.initEditorView(
            this.editorExtension(),
            editorElement,
            content,
            this.stylesOverride()
          );
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
  }
}
