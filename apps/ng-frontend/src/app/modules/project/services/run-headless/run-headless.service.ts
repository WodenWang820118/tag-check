import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';

const STORAGE_PREFIX = 'tag-check.run-headless.';

function storageKey(projectSlug: string): string {
  return `${STORAGE_PREFIX}${projectSlug}`;
}

/** The choice stored for the project, or undefined when there is none. */
function readStored(projectSlug: string): boolean | undefined {
  try {
    const stored = localStorage.getItem(storageKey(projectSlug));
    return stored === 'true' ? true : stored === 'false' ? false : undefined;
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return undefined;
  }
}

/**
 * Whether the Tests page runs tests headless: the play button and Run
 * selected. The user's choice is remembered per project in this browser;
 * until they choose, it follows the project's browser setting.
 */
@Injectable({ providedIn: 'root' })
export class RunHeadlessService {
  private readonly settingsService = inject(SettingsService);
  private readonly state = signal<{
    projectSlug: string;
    headless: boolean;
  } | null>(null);
  private settingsSubscription: Subscription | null = null;

  /** The choice for the project last loaded; false before any load. */
  readonly headless = computed(() => this.state()?.headless ?? false);

  /**
   * Reads the choice for the project: the stored one, otherwise the
   * project's browser setting, read again on every load so that a change on
   * the settings page applies.
   */
  load(projectSlug: string): void {
    this.settingsSubscription?.unsubscribe();
    this.settingsSubscription = null;
    const stored = readStored(projectSlug);
    if (stored !== undefined) {
      this.state.set({ projectSlug, headless: stored });
      return;
    }
    const current = this.state();
    this.state.set({
      projectSlug,
      headless: current?.projectSlug === projectSlug ? current.headless : false
    });
    this.settingsSubscription = this.settingsService
      .getProjectSettings(projectSlug)
      .pipe(take(1))
      .subscribe({
        next: (project) => {
          if (this.state()?.projectSlug === projectSlug) {
            this.state.set({
              projectSlug,
              headless: project.browserSettings.headless === true
            });
          }
        },
        error: (error: unknown) => console.error(error)
      });
  }

  /** The choice for `projectSlug`, or undefined when it is not loaded. */
  headlessFor(projectSlug: string): boolean | undefined {
    const state = this.state();
    return state?.projectSlug === projectSlug ? state.headless : undefined;
  }

  /** Sets and remembers the choice for the loaded project. */
  set(headless: boolean): void {
    const state = this.state();
    if (!state) {
      return;
    }
    this.settingsSubscription?.unsubscribe();
    this.settingsSubscription = null;
    this.state.set({ projectSlug: state.projectSlug, headless });
    try {
      localStorage.setItem(storageKey(state.projectSlug), String(headless));
    } catch {
      // The choice still applies until the page reloads.
    }
  }
}
