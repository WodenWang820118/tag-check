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
      <div class="toolbar-placeholder"></div>
    }

    @defer {
      <app-router-container></app-router-container>
    } @loading (minimum 600ms) {
      <div class="spinner-overlay">
        <div class="loading-shell">
          <div class="loading-badge">TC</div>
          <mat-spinner diameter="56"></mat-spinner>
          <p class="loading-title">Loading Tag Check</p>
          <p class="loading-copy">
            Preparing your workspace and recent projects.
          </p>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .toolbar-placeholder {
        height: 64px;
        background: linear-gradient(
          135deg,
          rgba(26, 35, 126, 0.96) 0%,
          rgba(40, 53, 147, 0.96) 100%
        );
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
      }

      .spinner-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        background:
          radial-gradient(
            circle at top,
            rgba(129, 140, 248, 0.18),
            transparent 46%
          ),
          linear-gradient(135deg, #1a237e 0%, #283593 52%, #3949ab 100%);
      }

      .loading-shell {
        display: flex;
        width: min(340px, calc(100vw - 32px));
        flex-direction: column;
        align-items: center;
        gap: 16px;
        border-radius: 24px;
        padding: 32px 28px;
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
        color: #fff;
        text-align: center;
        backdrop-filter: blur(14px);
      }

      .loading-badge {
        display: grid;
        height: 68px;
        width: 68px;
        place-items: center;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.16);
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .loading-title {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .loading-copy {
        margin: 0;
        color: rgba(255, 255, 255, 0.76);
        font-size: 0.95rem;
        line-height: 1.5;
      }
    `
  ]
})
export class AppComponent {
  title = 'Tag Check';
}
