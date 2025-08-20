import { computed, Injectable, signal } from '@angular/core';

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
