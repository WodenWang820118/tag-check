import { Component, LOCALE_ID, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  FooterComponent,
  ToolBarComponent,
  buildLocalizedPath,
  type ToolbarInputs
} from '@ui';
import { SeoService } from './seo/seo.service';

@Component({
  imports: [RouterOutlet, ToolBarComponent, FooterComponent],
  standalone: true,
  selector: 'app-root',
  template: `
    <lib-toolbar
      [title]="toolbarInputs.title"
      [primaryLink]="toolbarInputs.primaryLink"
    ></lib-toolbar>
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
  private readonly locale = inject(LOCALE_ID);

  readonly title = 'TagCheck';
  readonly toolbarInputs = {
    title: this.title,
    primaryLink: {
      href: buildLocalizedPath('/documentation/introduction', this.locale),
      label: $localize`:@@docs.sidebar.gettingStarted:Getting Started`,
      icon: 'menu_book',
      logicalPath: '/documentation',
      matchStrategy: 'prefix'
    }
  } satisfies ToolbarInputs;

  ngOnInit(): void {
    this.seo.start();
  }
}
