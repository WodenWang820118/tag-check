import { computed, Injectable, signal } from '@angular/core';
import { debounceTime, fromEvent, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WindowSizeService {
  private readonly width = signal<number>(window.innerWidth);
  width$ = computed(() => this.width());

  constructor() {
    this.onResize().subscribe();
  }

  onResize() {
    return fromEvent(window, 'resize').pipe(
      debounceTime(100),
      tap((event) => {
        this.width.set((event.target as Window).innerWidth);
      })
    );
  }
}
