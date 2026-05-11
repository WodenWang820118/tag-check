import { DOCUMENT } from '@angular/common';
import { Component, Inject, LOCALE_ID, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import {
  buildLocalizedPath,
  stripLocalePrefix
} from '../../locale/locale-routing';

@Component({
  selector: 'lib-menu-tabs',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <!-- Inline tab nav: visible on large viewports (laptop/desktop). -->
    <nav
      mat-tab-nav-bar
      [tabPanel]="tabPanel"
      class="hidden! lg:flex!"
      aria-label="Primary navigation"
    >
      <a
        mat-tab-link
        [href]="appPath"
        [active]="isActive('/app')"
        class="nav-link-container"
      >
        <mat-icon class="nav-icon">build</mat-icon>
        <span i18n="@@nav.app" class="nav-text">App</span>
      </a>

      @if (!aboutDisabled()) {
        <a
          mat-tab-link
          [href]="aboutPath"
          [active]="isActive('/about')"
          class="nav-link-container"
        >
          <mat-icon class="nav-icon">info</mat-icon>
          <span i18n="@@nav.about" class="nav-text">About</span>
        </a>
      }

      @if (!objectivesDisabled()) {
        <a
          mat-tab-link
          [href]="objectivesPath"
          [active]="isActive('/objectives')"
          class="nav-link-container"
        >
          <mat-icon class="nav-icon">location_on</mat-icon>
          <span i18n="@@nav.objectives" class="nav-text">Objectives</span>
        </a>
      }

      <a
        mat-tab-link
        [href]="githubUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="nav-link-container"
      >
        <mat-icon class="nav-icon">code</mat-icon>
        <span i18n="@@nav.github" class="nav-text">GitHub</span>
      </a>
    </nav>
    <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>

    <!-- Hamburger menu: visible below the laptop breakpoint. -->
    <button
      type="button"
      mat-icon-button
      class="lg:hidden! nav-hamburger"
      [matMenuTriggerFor]="mobileMenu"
      aria-label="Open navigation menu"
    >
      <mat-icon>menu</mat-icon>
    </button>
    <mat-menu #mobileMenu="matMenu">
      <a mat-menu-item [href]="appPath">
        <mat-icon>build</mat-icon>
        <span i18n="@@nav.app">App</span>
      </a>
      @if (!aboutDisabled()) {
        <a mat-menu-item [href]="aboutPath">
          <mat-icon>info</mat-icon>
          <span i18n="@@nav.about">About</span>
        </a>
      }
      @if (!objectivesDisabled()) {
        <a mat-menu-item [href]="objectivesPath">
          <mat-icon>location_on</mat-icon>
          <span i18n="@@nav.objectives">Objectives</span>
        </a>
      }
      <a
        mat-menu-item
        [href]="githubUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <mat-icon>code</mat-icon>
        <span i18n="@@nav.github">GitHub</span>
      </a>
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .nav-link-container {
        display: flex !important;
        align-items: center;
        gap: 8px;
      }
      .nav-icon {
        margin-right: 4px;
        display: flex;
        align-items: center;
        color: white;
      }
      .nav-text {
        display: flex;
        align-items: center;
        color: white;
      }
      .nav-hamburger {
        color: white;
      }
    `
  ]
})
export class MenuTabsComponent {
  readonly githubUrl = 'https://github.com/WodenWang820118/tag-check';
  readonly appPath: string;
  readonly aboutPath: string;
  readonly objectivesPath: string;
  aboutDisabled = input<boolean>(false);
  objectivesDisabled = input<boolean>(false);

  constructor(
    @Inject(LOCALE_ID) locale: string,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.appPath = buildLocalizedPath('/app', locale);
    this.aboutPath = buildLocalizedPath('/about', locale);
    this.objectivesPath = buildLocalizedPath('/objectives', locale);
  }

  isActive(logicalPath: string): boolean {
    return stripLocalePrefix(this.document.location.pathname) === logicalPath;
  }
}
