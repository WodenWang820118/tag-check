import { computed, Injectable, signal } from '@angular/core';

/**
 * Holds the Event Settings variable JSON typed in tag-build's advanced
 * options.
 */
@Injectable({
  providedIn: 'root'
})
export class EsvEditorService {
  private readonly content = signal<string>('');
  content$ = computed(() => this.content());

  setEsvContent(content: string) {
    this.content.set(content);
  }
}
