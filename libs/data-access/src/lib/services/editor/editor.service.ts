import { computed, ElementRef, Injectable, signal } from '@angular/core';
import { EditorView } from 'codemirror';
import { placeholder } from '@codemirror/view';
import { BehaviorSubject } from 'rxjs';
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

  // contentSubjects = {
  //   inputJson: new BehaviorSubject(`Placeholder content for JSON editor`),
  //   outputJson: new BehaviorSubject(``)
  // };
  contents = {
    inputJson: signal(`Placeholder content for JSON editor`),
    outputJson: signal(`Placeholder content for JSON editor`)
  };

  // editorSubjects = {
  //   inputJson: new BehaviorSubject<EditorView>(new EditorView()),
  //   outputJson: new BehaviorSubject<EditorView>(new EditorView())
  // };
  editorSubjects = {
    inputJson: signal(new EditorView()),
    outputJson: signal(new EditorView())
  };

  // editor$ = {
  //   inputJson: this.editorSubjects.inputJson.asObservable(),
  //   outputJson: this.editorSubjects.outputJson.asObservable()
  // };
  editor$ = {
    inputJson: computed(() => this.editorSubjects.inputJson()),
    outputJson: computed(() => this.editorSubjects.outputJson())
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

    this.editorSubjects[extension].set(editorView);
  }

  setContent(extension: EditorTypeEnum, content: string) {
    // set content in contents
    this.contents[extension].set(content);
    // dispatch content to editorView
    this.editorSubjects[extension]().dispatch({
      changes: {
        from: 0,
        insert: content,
        to: this.editorSubjects[extension]().state.doc.length
      }
    });
  }
}
