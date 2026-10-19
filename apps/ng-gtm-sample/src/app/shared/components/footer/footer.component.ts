import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGithub } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-footer',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ lucideGithub })],
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
          <ng-icon name="lucideGithub" class="text-base" />
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
