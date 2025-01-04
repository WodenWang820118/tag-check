import { Component, viewChild } from '@angular/core';
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
    <mat-toolbar>
      <div style="margin-right: 8rem"></div>
      <span
        ><a [routerLink]="['./']" (click)="onTagBuildClick()"
          >Tag Build</a
        ></span
      >
      <span class="spacer"></span>
      <lib-menu-tabs #menuTabs></lib-menu-tabs>
      <lib-lang-select></lib-lang-select>
      <div style="margin-left: 6rem"></div>
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
  menuTabs = viewChild.required<MenuTabsComponent>('menuTabs');

  onTagBuildClick() {
    this.menuTabs().activeLink = null;
  }
}
