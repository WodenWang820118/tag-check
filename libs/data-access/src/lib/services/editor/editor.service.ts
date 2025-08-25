import { computed, ElementRef, Injectable, signal } from '@angular/core';
import { EditorView } from 'codemirror';
import { placeholder } from '@codemirror/view';
import { jsonLightEditorExtensions } from './editor-extensions';
import { editorStyles } from './editor-style';
import { linter, lintGutter } from '@codemirror/lint';
import { jsonParseLinter } from '@codemirror/lang-json';
import { EditorTypeEnum } from '@utils';
import { Extension } from '@codemirror/state';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  editorExtensions: Record<EditorTypeEnum, Extension[]> = {
    inputJson: jsonLightEditorExtensions,
    outputJson: jsonLightEditorExtensions
  };

  private readonly contents = {
    inputJson: signal('[]'),
    outputJson: signal(`Placeholder content for JSON editor`)
  };

  contents$ = {
    inputJson: computed(() => this.contents.inputJson()),
    outputJson: computed(() => this.contents.outputJson())
  };

  private readonly editors = {
    inputJson: signal(new EditorView()),
    outputJson: signal(new EditorView())
  };

  editor$ = {
    inputJson: computed(() => this.editors.inputJson()),
    outputJson: computed(() => this.editors.outputJson())
  };

  initEditorView(
    extension: EditorTypeEnum,
    elementRef: ElementRef,
    content?: string
  ) {
    let editorView = null;
    if (extension === 'inputJson') {
      editorView = new EditorView({
        extensions: [
          ...this.editorExtensions[extension],
          linter(jsonParseLinter()),
          lintGutter(),
          EditorView.theme(editorStyles),
          EditorView.lineWrapping,
          placeholder(content || this.contents[extension]())
        ],
        parent: elementRef.nativeElement
      });
    } else if (extension === 'outputJson') {
      editorView = new EditorView({
        extensions: [
          ...this.editorExtensions[extension],
          EditorView.theme(editorStyles),
          EditorView.lineWrapping,
          placeholder(content || this.contents[extension]())
        ],
        parent: elementRef.nativeElement
      });
    } else {
      editorView = new EditorView({
        extensions: this.editorExtensions[extension],
        parent: elementRef.nativeElement
      });
    }

    if (extension === 'inputJson') {
      editorView.dispatch({
        changes: {
          from: 0,
          insert: content || '[]',
          to: editorView.state.doc.length
        }
      });
    }

    this.editors[extension].set(editorView);
  }

  setContent(extension: EditorTypeEnum, content: string) {
    // set content in contents
    this.contents[extension].set(content);
    console.debug('setContent', content);
    // dispatch content to editorView
    this.editors[extension]().dispatch({
      changes: {
        from: 0,
        insert: content,
        to: this.editors[extension]().state.doc.length
      }
    });
  }
}
