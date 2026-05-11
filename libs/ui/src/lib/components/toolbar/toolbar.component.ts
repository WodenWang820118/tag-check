import { Component, Inject, LOCALE_ID, input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MenuTabsComponent } from '../menu-tabs/menu-tabs.component';
import { LangSelectComponent } from '../lang-select/lang-select.component';
import { buildLocalizedPath } from '../../locale/locale-routing';

export interface ToolbarInputs {
  title: string;
  aboutDisabled?: boolean;
  objectivesDisabled?: boolean;
}

@Component({
  selector: 'lib-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MenuTabsComponent,
    LangSelectComponent
  ],
  template: `
    <mat-toolbar color="primary">
      <div style="margin-right: 1rem"></div>
      <span>
        <a [href]="homePath"> {{ title() }}</a>
      </span>
      <span class="spacer"></span>
      <lib-menu-tabs
        [aboutDisabled]="aboutDisabled()"
        [objectivesDisabled]="objectivesDisabled()"
      ></lib-menu-tabs>
      <lib-lang-select></lib-lang-select>
      <div style="margin-left: 1rem"></div>
    </mat-toolbar>
  `,
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
  aboutDisabled = input<boolean>(false);
  objectivesDisabled = input<boolean>(false);
  readonly homePath: string;

  constructor(@Inject(LOCALE_ID) locale: string) {
    this.homePath = buildLocalizedPath('/', locale);
  }
}
