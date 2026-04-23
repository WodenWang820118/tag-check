import { computed, ElementRef, Injectable, signal } from '@angular/core';
import { Extension } from '@codemirror/state';
import { jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { EditorView } from 'codemirror';
import { StrictDataLayerEvent } from '@utils';
import { jsonLightEditorExtensions } from './editor-extensions';
import { editorStyles } from './editor-style';

export type EditorExtension = 'specJson' | 'recordingJson' | 'itemDefJson';
type ExtensionArray = Extension[];
type ThemeValue = string | number | null | ThemeDecl;

interface ThemeDecl {
  [prop: string]: ThemeValue;
}

export type EditorThemeStyles = Record<string, ThemeDecl>;

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  editorExtensions: Record<EditorExtension, ExtensionArray> = {
    specJson: jsonLightEditorExtensions,
    recordingJson: jsonLightEditorExtensions,
    itemDefJson: jsonLightEditorExtensions
  };

  contentSubjects = {
    specJson: signal<string>(''),
    recordingJson: signal<string>(''),
    itemDefJson: signal<string>('')
  };

  editorViewSubjects = {
    specJson: signal<EditorView>(new EditorView()),
    recordingJson: signal<EditorView>(new EditorView()),
    itemDefJson: signal<EditorView>(new EditorView())
  };

  editor$ = {
    specJsonEditor: computed(() => this.editorViewSubjects.specJson()),
    recordingJsonEditor: computed(() =>
      this.editorViewSubjects.recordingJson()
    ),
    itemDefJsonEditor: computed(() => this.editorViewSubjects.itemDefJson())
  };

  isJsonSyntaxError = signal<boolean>(false);
  isJsonSyntaxError$ = computed(() => this.isJsonSyntaxError());

  private readonly jsonSyntaxErrorByExt = {
    specJson: signal<boolean>(false),
    recordingJson: signal<boolean>(false),
    itemDefJson: signal<boolean>(false)
  };

  jsonSyntaxError$ = {
    specJson: computed(() => this.jsonSyntaxErrorByExt.specJson()),
    recordingJson: computed(() => this.jsonSyntaxErrorByExt.recordingJson()),
    itemDefJson: computed(() => this.jsonSyntaxErrorByExt.itemDefJson())
  } as const;

  initEditorView(
    extension: EditorExtension,
    elementRef: ElementRef,
    content: string,
    styleOverrides?: EditorThemeStyles,
    extraExtensions: Extension[] = []
  ) {
    const mergedTheme = this.mergeTheme(editorStyles, styleOverrides);
    const editorView = new EditorView({
      extensions: [
        ...this.editorExtensions[extension],
        linter(jsonParseLinter()),
        lintGutter(),
        EditorView.theme(mergedTheme),
        EditorView.lineWrapping,
        EditorView.editorAttributes.of({
          role: 'textbox',
          'aria-label': 'Code editor'
        }),
        ...extraExtensions,
        this.isEditorSyntaxError(extension)
      ],
      parent: elementRef.nativeElement
    });

    let initialInsert = '';
    try {
      if (content.trim()) {
        initialInsert = JSON.stringify(JSON.parse(content), null, 2);
        this.jsonSyntaxErrorByExt[extension].set(false);
      }
    } catch (error) {
      initialInsert = content ?? '';
      this.jsonSyntaxErrorByExt[extension].set(true);
      this.isJsonSyntaxError.set(true);
      console.error(
        'Failed to parse initial editor content for',
        extension,
        error
      );
    }

    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: initialInsert
      }
    });

    this.editorViewSubjects[extension].set(editorView);
    return editorView;
  }

  setContent(extension: EditorExtension, content: string) {
    const view = this.editorViewSubjects[extension]();

    if (!content.trim()) {
      this.contentSubjects[extension].set('');
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: '' }
      });
      this.jsonSyntaxErrorByExt[extension].set(false);
      this.isJsonSyntaxError.set(false);
      return;
    }

    try {
      const parsed = JSON.parse(content);
      const jsonContent = JSON.stringify(parsed, null, 2);
      this.contentSubjects[extension].set(jsonContent);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: jsonContent }
      });
      this.jsonSyntaxErrorByExt[extension].set(false);
      this.isJsonSyntaxError.set(false);
    } catch (error) {
      console.error('setContent: failed to parse JSON for', extension, error);
      this.contentSubjects[extension].set(content);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      });
      this.jsonSyntaxErrorByExt[extension].set(true);
      this.isJsonSyntaxError.set(true);
    }
  }

  hasSyntaxError(content: string, extension?: EditorExtension): boolean {
    return this.checkSyntax(content, extension);
  }

  isEditorSyntaxError(extension: EditorExtension) {
    return EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        const isError = this.checkSyntax(content, extension);
        this.isJsonSyntaxError.set(isError);
        this.jsonSyntaxErrorByExt[extension].set(isError);
      }
    });
  }

  private checkSyntax(content: string, extension?: EditorExtension): boolean {
    if (!content?.trim()) {
      return true;
    }

    try {
      const parsed = JSON.parse(content);

      if (extension === 'specJson') {
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof (parsed as Partial<StrictDataLayerEvent>).event === 'string' &&
          ((parsed as Partial<StrictDataLayerEvent>).event ?? '').length > 0
        ) {
          return false;
        }

        return true;
      }

      return false;
    } catch {
      return true;
    }
  }

  private mergeTheme(
    base: EditorThemeStyles,
    overrides?: EditorThemeStyles
  ): EditorThemeStyles {
    if (!overrides) {
      return base;
    }

    const result: EditorThemeStyles = { ...base };
    for (const selector of Object.keys(overrides)) {
      result[selector] = {
        ...(base[selector] ? base[selector] : {}),
        ...overrides[selector]
      };
    }

    return result;
  }
}
