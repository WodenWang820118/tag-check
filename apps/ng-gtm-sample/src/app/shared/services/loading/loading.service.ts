import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly loadingState = signal<boolean>(true);
  readonly loadingState$ = computed(() => this.loadingState());

  setLoadingState(isLoading: boolean) {
    this.loadingState.set(isLoading);
  }

  getLoadingState() {
    return this.loadingState$;
  }
}
