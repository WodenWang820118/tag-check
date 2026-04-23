import { Component } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-footer',
  imports: [ToolbarModule, ButtonModule, InputTextModule],
  template: `
    <p-toolbar class="sample-shell border-none bg-transparent px-0 py-4">
      <ng-template #start>
        <div
          id="externalLinks"
          class="flex flex-col gap-1 text-sm text-slate-600"
        >
          <span
            class="font-semibold uppercase tracking-[0.24em] text-slate-500"
          >
            Project Credits
          </span>
          <a
            class="inline-flex items-center gap-2 font-medium text-slate-800 transition-colors hover:text-blue-700"
            href="https://github.com/WodenWang820118"
            target="_blank"
            rel="noreferrer"
          >
            <i class="pi pi-github text-base"></i>
            Guan Xin Wang
          </a>
        </div>
      </ng-template>
      <ng-template #end>
        <div
          id="newsletter-form"
          class="flex flex-col gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            pInputText
            type="text"
            id="newsletter"
            placeholder="Newsletter..."
            class="w-full min-w-0 border-none bg-transparent px-2 py-1 text-sm text-slate-700 shadow-none outline-none sm:w-64"
          />
          <button
            pButton
            type="button"
            label="OK"
            severity="secondary"
            size="small"
            class="shrink-0"
          ></button>
          <div id="response" class="min-h-5 text-xs text-slate-500"></div>
        </div>
      </ng-template>
    </p-toolbar>
  `
})
export class FooterComponent {}
