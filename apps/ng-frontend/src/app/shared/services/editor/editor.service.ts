import { computed, ElementRef, Injectable, signal } from '@angular/core';
import { EditorView } from 'codemirror';
import { Extension } from '@codemirror/state';
import { jsonLightEditorExtensions } from './editor-extensions';
import { StrictDataLayerEvent } from '@utils';
import { editorStyles } from './editor-style';
import { linter, lintGutter } from '@codemirror/lint';
import { jsonParseLinter } from '@codemirror/lang-json';

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
    styleOverrides?: EditorThemeStyles
  ) {
    const mergedTheme = this.mergeTheme(editorStyles, styleOverrides);
    const editorView = new EditorView({
      extensions: [
        ...this.editorExtensions[extension],
        linter(jsonParseLinter()),
        lintGutter(),
        EditorView.theme(mergedTheme),
        EditorView.lineWrapping,
        // Add ARIA attributes for accessibility
        EditorView.editorAttributes.of({
          role: 'textbox',
          'aria-label': 'Code editor'
        }),
        this.isEditorSyntaxError(extension)
        // placeholder(
        //   content ? content : this.contentSubjects[extension].getValue()
        // ),
      ],
      parent: elementRef.nativeElement
    });

    // Safely parse and pretty-print initial content. If parsing fails,
    // insert the raw content and mark syntax error state so the UI can react.
    let initialInsert = '';
    try {
      if (content.trim()) {
        initialInsert = JSON.stringify(JSON.parse(content), null, 2);
        this.jsonSyntaxErrorByExt[extension].set(false);
      }
    } catch (err) {
      // Keep the raw content so user can see/edit the invalid JSON
      initialInsert = content ?? '';
      this.jsonSyntaxErrorByExt[extension].set(true);
      this.isJsonSyntaxError.set(true);
      console.error(
        'Failed to parse initial editor content for',
        extension,
        err
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
    console.log('Setting content for', extension);
    console.log('New content:', content);
    // Defensive handling: if content is empty, clear the editor.
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

    // Try to parse and pretty-print. On failure, don't throw — set syntax error
    // flags and insert the raw content so the user can fix it.
    try {
      const parsed = JSON.parse(content);
      const jsonContent = JSON.stringify(parsed, null, 2);
      this.contentSubjects[extension].set(jsonContent);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: jsonContent }
      });
      this.jsonSyntaxErrorByExt[extension].set(false);
      this.isJsonSyntaxError.set(false);
    } catch (err) {
      console.error('setContent: failed to parse JSON for', extension, err);
      // leave the raw content in the editor so user can correct it
      this.contentSubjects[extension].set(content);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      });
      this.jsonSyntaxErrorByExt[extension].set(true);
      this.isJsonSyntaxError.set(true);
    }
  }

  isEditorSyntaxError(extension: EditorExtension) {
    return EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Document has changed, perform syntax and minimal shape checking
        const content = update.state.doc.toString();
        const isError = this.checkSyntax(content, extension);
        this.isJsonSyntaxError.set(isError);
        this.jsonSyntaxErrorByExt[extension].set(isError);
        console.log('syntaxError', extension, isError);
      }
    });
  }

  // Minimal validation implemented below to align with StrictDataLayerEvent shape
  /**
   * Check JSON syntax and perform minimal structural validation.
   * Returns true when content is invalid (syntax error or fails minimal checks).
   */
  private checkSyntax(content: string, extension?: EditorExtension): boolean {
    if (!content?.trim()) {
      return true;
    }
    try {
      const parsed = JSON.parse(content);

      // For spec editor we require at least a StrictDataLayerEvent-like shape
      if (extension === 'specJson') {
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof (parsed as Partial<StrictDataLayerEvent>).event === 'string' &&
          ((parsed as Partial<StrictDataLayerEvent>).event ?? '').length > 0
        ) {
          return false; // valid
        }
        return true; // missing required `event` string
      }

      // For recording or other editors, any valid JSON is acceptable
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Merge default theme with optional overrides per CSS selector.
   * Shallow merges each selector's properties so overrides can partially replace defaults.
   */
  private mergeTheme(
    base: EditorThemeStyles,
    overrides?: EditorThemeStyles
  ): EditorThemeStyles {
    if (!overrides) return base;
    const result: EditorThemeStyles = { ...base };
    for (const selector of Object.keys(overrides)) {
      // Only spread base properties when they exist to avoid creating
      // unnecessary empty fallback objects when merging.
      result[selector] = {
        ...(base[selector] ? base[selector] : {}),
        ...overrides[selector]
      };
    }
    return result;
  }
}
