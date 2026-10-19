import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminNavbarComponent } from '../../../../shared/components/navbar/admin-navbar.component';
import { RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBriefcase,
  lucideChartColumn,
  lucidePlus
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-admin-home',
  imports: [AdminNavbarComponent, RouterOutlet, HlmButton, NgIcon],
  providers: [provideIcons({ lucideBriefcase, lucideChartColumn, lucidePlus })],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="sample-shell space-y-6 pb-10">
      <app-admin-navbar></app-admin-navbar>

      <section
        class="sample-panel flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="space-y-3">
          <span class="sample-eyebrow">
            <ng-icon name="lucideBriefcase" class="text-sm" />
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
            hlmBtn
            type="button"
            data-testid="admin-dashboard"
            (click)="navigateToDashboard()"
          >
            <ng-icon name="lucideChartColumn" />
            Dashboard
          </button>
          <button
            hlmBtn
            variant="outline"
            type="button"
            data-testid="admin-add-destination"
            (click)="navigateToAddData()"
          >
            <ng-icon name="lucidePlus" />
            Add Destination
          </button>
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
