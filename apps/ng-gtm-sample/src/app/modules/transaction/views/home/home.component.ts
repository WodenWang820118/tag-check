import { Component } from '@angular/core';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { DisclaimerComponent } from '../../../../shared/components/disclaimer/disclaimer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-transaction-home',
  imports: [
    FooterComponent,
    NavbarComponent,
    DisclaimerComponent,
    RouterOutlet,
  ],
  template: `
    <div class="flex flex-col min-h-screen">
      <app-navbar class="w-full bg-white shadow-md"></app-navbar>
      <main class="flex-grow max-w-7xl mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>
      <app-footer class="w-full bg-gray-50 py-4"></app-footer>
      <app-disclaimer
        class="text-center text-xs text-gray-500 py-2"
      ></app-disclaimer>
    </div>
  `,
  styles: [``],
})
export class HomeComponent {}
