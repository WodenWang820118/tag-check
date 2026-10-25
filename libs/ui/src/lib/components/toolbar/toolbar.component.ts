import {
  Component,
  Inject,
  LOCALE_ID,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MenuTabsComponent } from '../menu-tabs/menu-tabs.component';
import { LangSelectComponent } from '../lang-select/lang-select.component';
import { buildLocalizedPath } from '../../locale/locale-routing';
import { type SharedNavigationLink } from '../navigation-link';

export interface ToolbarInputs {
  title: string;
  primaryLink: SharedNavigationLink;
  docsLink?: SharedNavigationLink;
  aboutDisabled?: boolean;
  objectivesDisabled?: boolean;
}

/**
 * The public sites' toolbar: title, navigation and language picker.
 */
@Component({
  selector: 'lib-toolbar',
  standalone: true,
  imports: [MatToolbar, MenuTabsComponent, LangSelectComponent],
  template: `
    <mat-toolbar color="primary">
      <div style="margin-right: 1rem"></div>
      <span>
        <a [href]="homePath"> {{ title() }}</a>
      </span>
      <span class="spacer"></span>
      <lib-menu-tabs
        [primaryLink]="primaryLink()"
        [docsLink]="docsLink()"
        [aboutDisabled]="aboutDisabled()"
        [objectivesDisabled]="objectivesDisabled()"
      ></lib-menu-tabs>
      <lib-lang-select></lib-lang-select>
      <div style="margin-left: 1rem"></div>
    </mat-toolbar>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .spacer {
        flex: 1 1 auto;
      }
    `
  ]
})
export class ToolBarComponent {
  title = input.required<string>();
  primaryLink = input.required<SharedNavigationLink>();
  docsLink = input<SharedNavigationLink>();
  aboutDisabled = input<boolean>(false);
  objectivesDisabled = input<boolean>(false);
  readonly homePath: string;

  constructor(@Inject(LOCALE_ID) locale: string) {
    this.homePath = buildLocalizedPath('/', locale);
  }
}
