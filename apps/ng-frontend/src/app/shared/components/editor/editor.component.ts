import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  EditorExtension,
  EditorService,
} from '../../services/editor/editor.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  template: `
    <div class="root-wrapper">
      <div id="cm-editor" #editor></div>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnChanges, AfterViewInit {
  @Input() editorExtension!: EditorExtension;
  @Input() content!: string;
  @Input() editMode = false;
  @ViewChild('editor') editorElement!: ElementRef<HTMLDivElement>;
  constructor(private readonly editorService: EditorService) {}

  ngAfterViewInit() {
    // the new report view
    if (!this.editMode) {
      this.initializeEditor();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && !changes['content'].firstChange) {
      this.initializeEditor();
    }
  }

  private initializeEditor() {
    if (this.editorElement) {
      this.editorService.initEditorView(
        this.editorExtension,
        this.editorElement,
        this.content
      );
    }
  }
}
