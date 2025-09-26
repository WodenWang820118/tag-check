import { Component } from '@angular/core';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';
import { RouterContainerComponent } from './app-router.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  imports: [
    RouterContainerComponent,
    ToolbarComponent,
    MatProgressSpinnerModule
  ],
  selector: 'app-root',
  template: `
    @defer (on immediate) {
      <app-toolbar [settings]="undefined" [projects]="undefined"></app-toolbar>
    } @placeholder {
      <div></div>
    }

    @defer {
      <app-router-container></app-router-container>
    } @loading (minimum 600ms) {
      <div class="spinner-overlay">
        <mat-spinner diameter="60"></mat-spinner>
      </div>
    }
  `,
  styles: [
    `
      .spinner-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        background: transparent;
      }
    `
  ]
})
export class AppComponent {
  title = 'Tag Check';
}
