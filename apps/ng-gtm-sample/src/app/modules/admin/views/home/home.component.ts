import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../../../../shared/components/navbar/admin-navbar.component';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-admin-home',
  imports: [AdminNavbarComponent, RouterOutlet, ButtonModule],
  template: `
    <div class="sample-shell space-y-6 pb-10">
      <app-admin-navbar></app-admin-navbar>

      <section
        class="sample-panel flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="space-y-3">
          <span class="sample-eyebrow">
            <i class="pi pi-briefcase text-sm"></i>
            Admin Workspace
          </span>
          <div>
            <h1 class="sample-page-title text-slate-950">
              Manage the demo storefront from one focused workspace.
            </h1>
            <p class="sample-copy mt-3 max-w-3xl">
              Review the destination footprint on the map, monitor the static
              sample KPIs, and prepare new destination entries for the Firebase
              content pipeline.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            pButton
            type="button"
            label="Dashboard"
            icon="pi pi-chart-bar"
            (click)="navigateToDashboard()"
          ></button>
          <button
            pButton
            type="button"
            label="Add Destination"
            icon="pi pi-plus"
            severity="secondary"
            [outlined]="true"
            (click)="navigateToAddData()"
          ></button>
        </div>
      </section>

      <div class="space-y-6">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class HomeComponent {
  constructor(private readonly navigationService: NavigationService) {}

  navigateToDashboard() {
    this.navigationService.navigateToAdmin();
  }

  navigateToAddData() {
    this.navigationService.navigateToAddData();
  }
}
