import { Component } from '@angular/core';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { DisclaimerComponent } from '../../../../shared/components/disclaimer/disclaimer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-product-home',
  imports: [
    FooterComponent,
    NavbarComponent,
    DisclaimerComponent,
    RouterOutlet
  ],
  template: `
    <div class="sample-route-shell">
      <app-navbar></app-navbar>
      <main class="sample-main">
        <router-outlet></router-outlet>
      </main>
      <footer class="sample-footer-area">
        <app-footer></app-footer>
        <app-disclaimer class="sample-shell pb-4 pt-1"></app-disclaimer>
      </footer>
    </div>
  `
})
export class HomeComponent {}
