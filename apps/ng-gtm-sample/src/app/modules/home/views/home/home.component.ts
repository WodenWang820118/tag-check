import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { DisclaimerComponent } from '../../../../shared/components/disclaimer/disclaimer.component';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [
    FooterComponent,
    NavbarComponent,
    DisclaimerComponent,
    RouterOutlet,
    HlmSpinner
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @defer {
      <div class="sample-route-shell">
        <app-navbar class="bg-white shadow"></app-navbar>
        <main class="sample-main">
          <router-outlet></router-outlet>
        </main>
        <footer class="sample-footer-area">
          <app-footer></app-footer>
          <app-disclaimer class="sample-shell pt-1 pb-4"></app-disclaimer>
        </footer>
      </div>
    } @placeholder (minimum 1.5s) {
      <div class="sample-loading-shell">
        <hlm-spinner
          aria-label="loading"
          class="text-[100px] text-emerald-500"
        />
      </div>
    }
  `
})
export class HomeComponent {}
