import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';

/** Lucide's GitHub icon (ISC), copied from @ng-icons/lucide 32: version 36 ships no brand icons. */
const githubIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="stroke-width:var(--ng-icon__stroke-width, 2)"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>';

@Component({
  selector: 'app-footer',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ github: githubIcon })],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="sample-shell flex flex-wrap items-center justify-between gap-4 py-4"
    >
      <div
        id="externalLinks"
        class="flex flex-col gap-1 text-sm text-slate-600"
      >
        <span class="font-semibold tracking-[0.24em] text-slate-500 uppercase">
          Project Credits
        </span>
        <a
          class="inline-flex items-center gap-2 font-medium text-slate-800 transition-colors hover:text-blue-700"
          href="https://github.com/WodenWang820118"
          target="_blank"
          rel="noreferrer"
        >
          <ng-icon name="github" class="text-base" />
          Guan Xin Wang
        </a>
      </div>
      <div
        id="newsletter-form"
        class="flex flex-col gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm sm:flex-row sm:items-center"
      >
        <input
          type="text"
          id="newsletter"
          placeholder="Newsletter..."
          aria-label="Newsletter email"
          class="w-full min-w-0 border-none bg-transparent px-2 py-1 text-sm text-slate-700 shadow-none outline-none sm:w-64"
        />
        <button
          hlmBtn
          variant="secondary"
          size="sm"
          type="button"
          class="shrink-0"
        >
          OK
        </button>
        <div id="response" class="min-h-5 text-xs text-slate-500"></div>
      </div>
    </div>
  `
})
export class FooterComponent {}
