import { Component } from '@angular/core';

@Component({
  selector: 'app-disclaimer',
  template: `
    <div
      id="disclaimer"
      class="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
    >
      <span>
        This is a demo storefront built to showcase GTM event tracking flows.
      </span>
      <span class="font-medium text-slate-600">
        Public routes and analytics behavior are intentionally preserved.
      </span>
    </div>
  `
})
export class DisclaimerComponent {}
