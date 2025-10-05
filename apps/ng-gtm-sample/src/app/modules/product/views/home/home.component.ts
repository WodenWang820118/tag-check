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
    RouterOutlet,
  ],
  template: `
    <div class="flex flex-col min-h-screen">
      <app-navbar></app-navbar>
      <main class="flex-1 p-4">
        <router-outlet></router-outlet>
      </main>
      <footer class="bg-white">
        <app-footer></app-footer>
        <app-disclaimer class="mt-2"></app-disclaimer>
      </footer>
    </div>
  `,
  styles: [``],
})
export class HomeComponent {}
