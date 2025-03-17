import { Component, input, viewChild } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MenuTabsComponent } from '../menu-tabs/menu-tabs.component';
import { RouterLink } from '@angular/router';
import { LangSelectComponent } from '../lang-select/lang-select.component';

@Component({
  selector: 'lib-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MenuTabsComponent,
    RouterLink,
    LangSelectComponent
  ],
  template: `
    <mat-toolbar color="primary">
      <div style="margin-right: 1rem"></div>
      <span>
        <a [routerLink]="['./']" (click)="onHomeClick()"> {{ title() }}</a>
      </span>
      <span class="spacer"></span>
      <lib-menu-tabs
        #menuTabs
        [aboutDisabled]="aboutDisabled()"
        [objectivesDisabled]="objectivesDisabled()"
      >
        ></lib-menu-tabs
      >
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
  menuTabs = viewChild.required<MenuTabsComponent>('menuTabs');

  onHomeClick() {
    this.menuTabs().activeLink = null;
  }
}
