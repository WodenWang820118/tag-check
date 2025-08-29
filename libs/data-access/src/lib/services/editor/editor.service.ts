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

  // Track the host element used for each editor to avoid duplicate initialization
  private readonly hosts: Record<EditorTypeEnum, HTMLElement | null> = {
    inputJson: null,
    outputJson: null
  };

  initEditorView(
    extension: EditorTypeEnum,
    elementRef: ElementRef,
    content?: string
  ) {
    const host = elementRef.nativeElement as HTMLElement;

    // Skip if already initialized on the same host
    if (this.hosts[extension] === host) return;

    // Cleanup any previous view/host for this extension
    this.destroyEditorForExtension(extension);

    // Ensure the current host is clean
    this.cleanupHost(host);

    // Create and mount the editor
    const editorView = this.buildEditorView(extension, host, content);

    // Initialize default content for input JSON
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
    this.hosts[extension] = host;
  }

  private destroyEditorForExtension(extension: EditorTypeEnum) {
    const existingView = this.editors[extension]();
    if (existingView) {
      try {
        existingView.destroy?.();
      } catch {
        // noop
      }
    }
    const prev = this.hosts[extension];
    if (prev) this.cleanupHost(prev);
    this.hosts[extension] = null;
  }

  private cleanupHost(host: HTMLElement | null | undefined) {
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
  }

  private buildEditorView(
    extension: EditorTypeEnum,
    host: HTMLElement,
    content?: string
  ): EditorView {
    if (extension === 'inputJson') {
      console.log('Initializing input JSON editor');
      return new EditorView({
        extensions: [
          ...this.editorExtensions[extension],
          linter(jsonParseLinter()),
          lintGutter(),
          EditorView.theme(editorStyles),
          placeholder(content || this.contents[extension]())
        ],
        parent: host
      });
    }
    if (extension === 'outputJson') {
      console.log('Initializing output JSON editor');
      return new EditorView({
        extensions: [
          ...this.editorExtensions[extension],
          EditorView.theme(editorStyles),
          placeholder(content || this.contents[extension]())
        ],
        parent: host
      });
    }
    console.warn('Unknown editor extension:', extension);
    return new EditorView({
      extensions: this.editorExtensions[extension],
      parent: host
    });
  }

  setContent(extension: EditorTypeEnum, content: string) {
    // set content in contents
    this.contents[extension].set(content);
    console.debug('setContent', content);
    // dispatch content to editorView
    const view = this.editors[extension]();
    try {
      view.dispatch({
        changes: {
          from: 0,
          insert: content,
          to: view.state.doc.length
        }
      });
    } catch (e) {
      console.warn(
        'Editor not ready for dispatch; queued content in signal only.',
        e
      );
    }
  }
}
