import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild
} from '@angular/core';
import { EditorView } from '@codemirror/view';
import {
  EditorExtension,
  EditorService,
  EditorThemeStyles
} from '../../services/editor/editor.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  template: `
    <div class="root-wrapper">
      <div id="cm-editor" #editor role="textbox" aria-label="Code editor"></div>
    </div>
  `,
  styles: [
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

  contentChange = output<string>();
  syntaxErrorChange = output<boolean>();

  private readonly editorContent = computed(() => this.content());
  private readonly editor = viewChild<ElementRef<HTMLDivElement>>('editor');
  private editorView: EditorView | null = null;

  constructor(private readonly editorService: EditorService) {
    effect(() => {
      const content = this.editorContent();
      const editorElement = this.editor();

      if (!editorElement || content === undefined) {
        return;
      }

      if (this.editorView) {
        const transaction = this.editorView.state.update({
          changes: {
            from: 0,
            to: this.editorView.state.doc.length,
            insert: content
          }
        });
        this.editorView.dispatch(transaction);
        this.syntaxErrorChange.emit(
          this.editorService.hasSyntaxError(content, this.editorExtension())
        );
        return;
      }

      this.editorView = this.editorService.initEditorView(
        this.editorExtension(),
        editorElement,
        content,
        this.stylesOverride(),
        [
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }

            const nextContent = update.state.doc.toString();
            this.contentChange.emit(nextContent);
            this.syntaxErrorChange.emit(
              this.editorService.hasSyntaxError(
                nextContent,
                this.editorExtension()
              )
            );
          })
        ]
      );
    });
  }

  ngOnDestroy() {
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
  }
}
