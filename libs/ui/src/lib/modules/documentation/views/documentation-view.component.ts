import { Component, OnInit } from '@angular/core';
import { SideBarComponent } from '../components/sidebar/sidebar.component';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-documentation-view',
  standalone: true,
  imports: [SideBarComponent, RouterOutlet],
  template: `
    <div class="documentation-layout">
      <app-sidebar class="documentation-layout__sidebar"></app-sidebar>
      <main class="documentation-layout__content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .documentation-layout {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 24px;
        height: 100%;
        margin: 0 auto;
        overflow: hidden;

        &__sidebar {
          border-right: 1px solid var(--border-color, #e0e0e0);
          padding: 2rem 16px;
          height: 100%;
          overflow-y: auto;
        }

        &__content {
          height: 100%;
          overflow: hidden;
        }
      }
    `
  ]
})
export class HelpCenterViewComponent implements OnInit {
  constructor(private router: Router) {}
  ngOnInit(): void {
    this.router.navigate(['/documentation/introduction']);
  }
}
