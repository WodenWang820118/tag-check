import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent, ToolBarComponent, type ToolbarInputs } from '@ui';
import { SeoService } from './seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToolBarComponent, FooterComponent],
  template: `
    <lib-toolbar [title]="toolbarInputs.title"></lib-toolbar>

    <div class="app">
      <router-outlet></router-outlet>
    </div>

    <lib-footer></lib-footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100dvh;
      }

      .app {
        flex: 1 1 auto;
        width: 100%;
        padding-block: clamp(1rem, 3vw, 3rem);
      }
    `
  ]
})
export class AppComponent implements OnInit {
  private readonly seo = inject(SeoService);
  readonly title = 'Tag Build';
  readonly toolbarInputs = { title: this.title } satisfies ToolbarInputs;

  ngOnInit(): void {
    this.seo.start();
  }
}
