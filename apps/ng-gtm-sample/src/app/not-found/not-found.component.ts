import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <p class="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>
        The page you requested does not exist in this demo. You can return to
        the public catalog or start again from the home page.
      </p>
      <div class="actions">
        <a routerLink="/home">Go to home</a>
        <a routerLink="/product/destinations">Browse destinations</a>
      </div>
    </main>
  `,
  styles: [
    `
      .not-found {
        min-height: 100vh;
        display: grid;
        place-content: center;
        gap: 1rem;
        padding: 2rem;
        text-align: center;
        background:
          radial-gradient(
            circle at top,
            rgba(15, 118, 110, 0.12),
            transparent 45%
          ),
          linear-gradient(180deg, #f7fbfb 0%, #eef6f5 100%);
      }

      .eyebrow {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: #0f766e;
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.5rem);
      }

      p {
        margin: 0 auto;
        max-width: 34rem;
        line-height: 1.6;
        color: #334155;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
      }

      a {
        padding: 0.875rem 1.25rem;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
        color: #ffffff;
        background: #0f766e;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {}
