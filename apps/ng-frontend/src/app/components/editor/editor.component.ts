import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewInit,
} from '@angular/core';
import {
  EditorExtension,
  EditorService,
} from '../../services/editor/editor.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  styles: [``],
  template: `<div id="cm-editor" #editor></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements AfterViewInit {
  @Input() editorExtension!: EditorExtension;
  @Input() content = '';
  @ViewChild('editor') editorElement!: ElementRef<HTMLDivElement>;
  constructor(private readonly editorService: EditorService) {}

  ngAfterViewInit() {
    this.editorService.initEditorView(
      this.editorExtension,
      this.editorElement,
      this.content
    );
  }
}
