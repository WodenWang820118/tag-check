import { Router, RouterModule } from '@angular/router';
import { Component, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ɵ$localize } from '@angular/localize';
import { NgClass } from '@angular/common';

interface Link {
  nameKey: string; // Changed from name to nameKey for translation reference
  icon: string;
  link: string;
}

@Component({
  selector: 'lib-menu-tabs',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, RouterModule, NgClass],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
      <a
        mat-tab-link
        (click)="activeLink = links[0]; navigateTo(links[0].link)"
        [active]="activeLink === links[0]"
        [ngClass]="{ hidden: aboutDisabled() }"
      >
        <mat-icon class="nav-icon">{{ links[0].icon }}</mat-icon>
        <span i18n="@@nav.about" class="nav-text">{{ links[0].nameKey }}</span>
      </a>

      <a
        mat-tab-link
        (click)="activeLink = links[1]; navigateTo(links[1].link)"
        [active]="activeLink === links[1]"
        class="nav-link-container"
        [ngClass]="{ hidden: objectivesDisabled() }"
      >
        <mat-icon class="nav-icon">{{ links[1].icon }}</mat-icon>
        <span i18n="@@nav.objectives" class="nav-text">{{
          links[1].nameKey
        }}</span>
      </a>

      <a
        mat-tab-link
        href="https://github.com/WodenWang820118/tag-check"
        (click)="activeLink = links[2]; navigateTo(links[2].link)"
        [active]="activeLink == links[2]"
        class="nav-link-container"
      >
        <mat-icon class="nav-icon" svgIcon="github"></mat-icon>
        <span i18n="@@nav.github" class="nav-text">GitHub</span>
      </a>
    </nav>
    <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
  `,
  styles: [
    `
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
      .hidden {
        display: none;
      }
    `
  ]
})
export class MenuTabsComponent {
  links = [
    {
      nameKey: 'About',
      icon: 'info',
      link: '/about'
    },
    {
      nameKey: 'Objectives',
      icon: 'location_on',
      link: '/objectives'
    },
    {
      nameKey: 'Github',
      icon: 'github',
      link: '/github'
    }
  ];
  activeLink: Link | null = null;
  aboutDisabled = input<boolean>(true);
  objectivesDisabled = input<boolean>();

  constructor(
    private readonly matIconRegistry: MatIconRegistry,
    private readonly domSanitizer: DomSanitizer,
    private readonly router: Router
  ) {
    this.matIconRegistry.addSvgIcon(
      'github',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/github.svg')
    );
  }

  // Helper method to get translated name
  getTranslatedName(key: string): string {
    // This will be replaced by actual translations
    const translations: { [key: string]: string } = {
      about: ɵ$localize`:@@nav.about:About`,
      objectives: ɵ$localize`:@@nav.objectives:Objectives`,
      github: ɵ$localize`:@@nav.github:GitHub`
    };
    return translations[key] || key;
  }

  navigateTo(link: string) {
    this.router.navigate([link]);
  }
}
