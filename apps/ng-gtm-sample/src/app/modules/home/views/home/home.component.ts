import { Component } from '@angular/core';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { DisclaimerComponent } from '../../../../shared/components/disclaimer/disclaimer.component';
import { RouterOutlet } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-home',
  imports: [
    FooterComponent,
    NavbarComponent,
    DisclaimerComponent,
    RouterOutlet,
    ProgressSpinnerModule
  ],
  template: `
    @defer {
      <div class="sample-route-shell">
        <app-navbar class="bg-white shadow"></app-navbar>
        <main class="sample-main">
          <router-outlet></router-outlet>
        </main>
        <footer class="sample-footer-area">
          <app-footer></app-footer>
          <app-disclaimer class="sample-shell pb-4 pt-1"></app-disclaimer>
        </footer>
      </div>
    } @placeholder (minimum 1.5s) {
      <div class="sample-loading-shell">
        <p-progress-spinner
          ariaLabel="loading"
          [style]="{ width: '100px', height: '100px' }"
        />
      </div>
    }
  `
})
export class HomeComponent {}
