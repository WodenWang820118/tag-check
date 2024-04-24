import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { MainContentComponent } from '../components/main-content/main-content.component';
import { SideBarComponent } from '../components/side-bar/side-bar.component';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-help-center-view',
  standalone: true,
  imports: [CommonModule, MainContentComponent, SideBarComponent, RouterModule],
  template: `
    <div class="help-center">
      <app-side-bar class="sidebar"></app-side-bar>
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .help-center {
        display: grid;
        grid-template-columns: 250px 1fr;
        grid-gap: 20px;
        height: 100%;
      }

      .sidebar {
        background-color: #f0f0f0;
        padding: 20px;
      }

      .main-content {
        background-color: #fff;
        padding: 20px;
      }
    `,
  ],
})
export class HelpCenterComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
