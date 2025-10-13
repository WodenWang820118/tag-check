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
    ProgressSpinnerModule,
  ],
  template: `
    @defer {
    <div class="flex flex-col min-h-screen">
      <app-navbar class="bg-white shadow"></app-navbar>
      <main class="flex-grow container mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>
      <footer class="bg-white">
        <app-footer></app-footer>
        <app-disclaimer class="mt-2"></app-disclaimer>
      </footer>
    </div>
    } @placeholder (minimum 1.5s) {
    <div class="fixed inset-0 flex items-center justify-center">
      <p-progress-spinner
        ariaLabel="loading"
        [style]="{ width: '100px', height: '100px' }"
      />
    </div>
    }
  `,
  styles: [``],
})
export class HomeComponent {}
