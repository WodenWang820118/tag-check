import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { EMPTY, debounceTime, fromEvent, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WindowSizeService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly width = signal<number>(
    this.browser ? globalThis.innerWidth : 0
  );
  width$ = computed(() => this.width());

  constructor() {
    if (this.browser) {
      this.onResize().subscribe();
    }
  }

  onResize() {
    if (!this.browser) {
      return EMPTY;
    }

    return fromEvent(globalThis, 'resize').pipe(
      debounceTime(100),
      tap((event) => {
        this.width.set((event.target as Window).innerWidth);
      })
    );
  }
}
