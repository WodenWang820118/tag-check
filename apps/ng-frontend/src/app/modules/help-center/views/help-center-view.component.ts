import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { SideBarComponent } from '../components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-help-center-view',
  standalone: true,
  imports: [AsyncPipe, SideBarComponent, RouterOutlet],
  template: `
    <div class="help-center">
      <app-sidebar class="sidebar"></app-sidebar>
      <div class="main-content-container">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .help-center {
        display: grid;
        grid-template-columns: 300px 1fr;
        grid-gap: 20px;
        height: 100%;
      }

      .sidebar {
        border-right: 1px solid black;
        padding: 20px;
      }

      .main-content-container {
        padding: 20px;
      }
    `,
  ],
})
export class HelpCenterViewComponent {}
