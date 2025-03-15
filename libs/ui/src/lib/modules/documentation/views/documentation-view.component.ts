import { Component, OnInit } from '@angular/core';
import { SideBarComponent } from '../components/sidebar/sidebar.component';
import { Router, RouterOutlet } from '@angular/router';
import { TreeNodeService } from '../services/tree-node/tree-node.service';

@Component({
  selector: 'app-help-center-view',
  standalone: true,
  imports: [SideBarComponent, RouterOutlet],
  template: `
    <div class="help-center-layout">
      <app-sidebar class="help-center-layout__sidebar"></app-sidebar>
      <main class="help-center-layout__content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .help-center-layout {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 24px;
        height: 100%;
        max-width: 1440px;
        margin: 0 auto;

        &__sidebar {
          border-right: 1px solid var(--border-color, #e0e0e0);
          padding: 2rem 16px;
          height: 100%;
          overflow-y: auto;
        }

        &__content {
          overflow-y: auto;
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
