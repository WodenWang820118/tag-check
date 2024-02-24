import { ElementRef, Injectable } from '@angular/core';
import { EditorView } from 'codemirror';
import { placeholder } from '@codemirror/view';
import { BehaviorSubject } from 'rxjs';
import { jsonLightEditorExtensions } from './editor-extensions';
import { editorStyles } from './editor-style';
import { linter, lintGutter } from '@codemirror/lint';
import { jsonParseLinter } from '@codemirror/lang-json';

export type EditorExtension = 'specJson' | 'recordingJson';
type ExtensionArray = any[];

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  editorExtensions: Record<EditorExtension, ExtensionArray> = {
    specJson: jsonLightEditorExtensions,
    recordingJson: jsonLightEditorExtensions,
  };

  contentSubjects = {
    specJson: new BehaviorSubject(''),
    recordingJson: new BehaviorSubject(''),
  };

  editorSubjects = {
    specJson: new BehaviorSubject<EditorView>(new EditorView()),
    recordingJson: new BehaviorSubject<EditorView>(new EditorView()),
  };

  editor$ = {
    specJsonEditor: this.editorSubjects.specJson.asObservable(),
    recordingJsonEditor: this.editorSubjects.recordingJson.asObservable(),
  };

  initEditorView(
    extension: EditorExtension,
    elementRef: ElementRef,
    content?: string
  ) {
    const editorView = new EditorView({
      extensions: [
        ...this.editorExtensions[extension],
        linter(jsonParseLinter()),
        lintGutter(),
        EditorView.theme(editorStyles),
        EditorView.lineWrapping,
        placeholder(
          content ? content : this.contentSubjects[extension].getValue()
        ),
      ],
      parent: elementRef.nativeElement,
    });

    editorView.dispatch({
      changes: {
        from: 0,
        insert: '',
        to: editorView.state.doc.length,
      },
    });

    this.editorSubjects[extension].next(editorView);
  }

  setContent(extension: EditorExtension, content: string) {
    const jsonContent = JSON.stringify(JSON.parse(content), null, 2);
    this.contentSubjects[extension].next(jsonContent);
    this.editorSubjects[extension].getValue().dispatch({
      changes: {
        from: 0,
        insert: jsonContent,
        to: this.editorSubjects[extension].getValue().state.doc.length,
      },
    });
  }
}
