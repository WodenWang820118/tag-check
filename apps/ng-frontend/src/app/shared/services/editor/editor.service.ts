import { ElementRef, Injectable } from '@angular/core';
import { EditorView } from 'codemirror';
import { Extension } from '@codemirror/state';
import { BehaviorSubject } from 'rxjs';
import { jsonLightEditorExtensions } from './editor-extensions';
import { editorStyles } from './editor-style';
import { linter, lintGutter } from '@codemirror/lint';
import { jsonParseLinter } from '@codemirror/lang-json';

export type EditorExtension = 'specJson' | 'recordingJson';
type ExtensionArray = Extension[];

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  editorExtensions: Record<EditorExtension, ExtensionArray> = {
    specJson: jsonLightEditorExtensions,
    recordingJson: jsonLightEditorExtensions
  };

  contentSubjects = {
    specJson: new BehaviorSubject(''),
    recordingJson: new BehaviorSubject('')
  };

  editorViewSubjects = {
    specJson: new BehaviorSubject<EditorView>(new EditorView()),
    recordingJson: new BehaviorSubject<EditorView>(new EditorView())
  };

  editor$ = {
    specJsonEditor: this.editorViewSubjects.specJson.asObservable(),
    recordingJsonEditor: this.editorViewSubjects.recordingJson.asObservable()
  };

  isJsonSyntaxError = new BehaviorSubject<boolean>(false);
  isJsonSyntaxError$ = this.isJsonSyntaxError.asObservable();

  initEditorView(
    extension: EditorExtension,
    elementRef: ElementRef,
    content: string
  ) {
    const editorView = new EditorView({
      extensions: [
        ...this.editorExtensions[extension],
        linter(jsonParseLinter()),
        lintGutter(),
        EditorView.theme(editorStyles),
        EditorView.lineWrapping,
        // Add ARIA attributes for accessibility
        EditorView.editorAttributes.of({
          role: 'textbox',
          'aria-label': 'Code editor'
        }),
        this.isEditorSyntaxError()
        // placeholder(
        //   content ? content : this.contentSubjects[extension].getValue()
        // ),
      ],
      parent: elementRef.nativeElement
    });

    editorView.dispatch({
      changes: {
        from: 0,
        insert: content ? JSON.stringify(JSON.parse(content), null, 2) : '',
        to: editorView.state.doc.length
      }
    });

    this.editorViewSubjects[extension].next(editorView);
    return editorView;
  }

  setContent(extension: EditorExtension, content: string) {
    const jsonContent = JSON.stringify(JSON.parse(content), null, 2);
    this.contentSubjects[extension].next(jsonContent);
    this.editorViewSubjects[extension].getValue().dispatch({
      changes: {
        from: 0,
        insert: jsonContent,
        to: this.editorViewSubjects[extension].getValue().state.doc.length
      }
    });
  }

  isEditorSyntaxError() {
    return EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Document has changed, you could trigger syntax checking here
        console.log('Document has changed');
        const isError = this.checkSyntax(update.state.doc.toString());
        this.isJsonSyntaxError.next(isError);
        console.log(this.isJsonSyntaxError.getValue());
      }
    });
  }

  private checkSyntax(content: string): boolean {
    try {
      JSON.parse(content);
      return false;
    } catch {
      return true;
    }
  }
}
