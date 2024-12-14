import {
  Component,
  ElementRef,
  input,
  ChangeDetectionStrategy,
  effect,
  viewChild,
  signal,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { EditorView, basicSetup } from 'codemirror';
import { json } from '@codemirror/lang-json';

@Component({
  selector: 'lib-general-editor',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `
  ],
  template: `<div id="cm-editor" #generalEditor></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralEditorComponent implements AfterViewInit, OnDestroy {
  content = input<string>('');
  languageExtension = input.required<string>();
  editorElement = viewChild<ElementRef<HTMLDivElement>>('generalEditor');
  editorView = signal<EditorView | null>(null);

  private contentEffect = effect(() => {
    const view = this.editorView();
    const content = this.content();

    if (view && content !== undefined) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content || '[]'
        }
      });
    }
  });

  ngAfterViewInit() {
    // Delay initialization slightly to ensure DOM is ready
    setTimeout(() => {
      const element = this.editorElement();
      if (element) {
        this.initEditor(element);
      }
    }, 0);
  }

  ngOnDestroy() {
    this.editorView()?.destroy();
    this.contentEffect.destroy();
  }

  private initEditor(elementRef: ElementRef) {
    const extensions = [basicSetup];

    if (this.languageExtension() === 'json') {
      extensions.push(json());
    }

    const view = new EditorView({
      parent: elementRef.nativeElement,
      extensions
    });

    // Set initial content
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: this.content() || '[]'
      }
    });

    this.editorView.set(view);
  }
}
