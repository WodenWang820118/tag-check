import { inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Abstract base class that provides the shared lifecycle contract for per-app
 * SEO services.
 *
 * Concrete subclasses must implement {@link applyCurrentRouteSeo} with their
 * own route-to-metadata mapping.  The base class owns the subscription loop so
 * that every subclass gets idempotent `start()` behaviour for free.
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class SeoService extends AbstractSeoService {
 *   override applyCurrentRouteSeo(): void {
 *     // set title, meta, canonical …
 *   }
 * }
 * ```
 */
export abstract class AbstractSeoService {
  protected readonly router = inject(Router);
  private started = false;

  /**
   * Arms the navigation listener and fires an immediate SEO pass for the
   * current route.  Safe to call multiple times — subsequent calls are no-ops.
   */
  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.applyCurrentRouteSeo();
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe(() => this.applyCurrentRouteSeo());
  }

  /**
   * Applies the SEO metadata appropriate for the currently active route.
   * Called once on `start()` and again after every {@link NavigationEnd} event.
   */
  abstract applyCurrentRouteSeo(): void;
}
