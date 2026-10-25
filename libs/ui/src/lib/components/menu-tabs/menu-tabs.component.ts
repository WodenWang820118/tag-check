import {
  Component,
  Inject,
  LOCALE_ID,
  afterRenderEffect,
  input,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// Standalone directives, not MatMenuModule: only standalone dependencies of
// a @defer block are loaded lazily.
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
// Type-only, so the menu directives stay deferrable.
import type { MatMenuTrigger as MenuTriggerRef } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import {
  buildLocalizedPath,
  stripLocalePrefix
} from '../../locale/locale-routing';
import { type SharedNavigationLink } from '../navigation-link';

/**
 * The public sites' navigation links, marking the one for the current
 * route as active.
 */
@Component({
  selector: 'lib-menu-tabs',
  standalone: true,
  imports: [
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  templateUrl: './menu-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  readonly aboutPath: string;
  readonly objectivesPath: string;
  readonly primaryLink = input.required<SharedNavigationLink>();
  readonly docsLink = input<SharedNavigationLink>();
  aboutDisabled = input<boolean>(false);
  objectivesDisabled = input<boolean>(false);
  /** Set when the placeholder button is clicked before the menu loaded. */
  openMobileMenuOnLoad = false;
  private readonly mobileMenuTrigger =
    viewChild<MenuTriggerRef>('mobileMenuTrigger');

  constructor(
    @Inject(LOCALE_ID) locale: string,
    private readonly router: Router
  ) {
    this.aboutPath = buildLocalizedPath('/about', locale);
    this.objectivesPath = buildLocalizedPath('/objectives', locale);

    afterRenderEffect(() => {
      const trigger = this.mobileMenuTrigger();
      if (trigger && this.openMobileMenuOnLoad) {
        this.openMobileMenuOnLoad = false;
        trigger.openMenu();
      }
    });
  }

  isLinkActive(link: SharedNavigationLink): boolean {
    if (!link.logicalPath) {
      return false;
    }

    const currentPath = stripLocalePrefix(this.router.url);

    if (link.matchStrategy === 'prefix') {
      return (
        currentPath === link.logicalPath ||
        currentPath.startsWith(`${link.logicalPath}/`)
      );
    }

    return currentPath === link.logicalPath;
  }

  isActive(logicalPath: string): boolean {
    return this.isLinkActive({
      href: logicalPath,
      label: '',
      icon: '',
      logicalPath
    });
  }
}
