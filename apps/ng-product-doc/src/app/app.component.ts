import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent, ToolBarComponent, type ToolbarInputs } from '@ui';
import { SeoService } from './seo/seo.service';

@Component({
  imports: [RouterOutlet, ToolBarComponent, FooterComponent],
  standalone: true,
  selector: 'app-root',
  template: `
    <lib-toolbar [title]="toolbarInputs.title"></lib-toolbar>
    <div class="app-content">
      <router-outlet />
    </div>
    <lib-footer></lib-footer>
  `,
  styles: [
    `
      .app-content {
        min-height: calc(100vh - 72px);
        overflow: hidden;
      }
    `
  ]
})
export class AppComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly title = 'TagCheck';
  readonly toolbarInputs = { title: this.title } satisfies ToolbarInputs;

  ngOnInit(): void {
    this.seo.start();
  }
}
