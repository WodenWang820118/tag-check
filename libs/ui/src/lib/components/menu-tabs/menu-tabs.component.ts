// menu-tabs.component.ts
import { Router, RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import '@angular/localize/init'; // For $localize

interface Link {
  nameKey: string; // Changed from name to nameKey for translation reference
  icon: string;
  link: string;
}

@Component({
  selector: 'lib-menu-tabs',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, RouterModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
      <!-- @for (link of links; track link) {
        @if (link.nameKey.toLowerCase() === 'github') {
          <a
            mat-tab-link
            (click)="activeLink = link; navigateTo(link.link)"
            [active]="activeLink == link"
            class="nav-link-container"
          >
            <mat-icon class="nav-icon" svgIcon="github"></mat-icon>
            <span i18n="@@nav.github">GitHub</span>
          </a>
        } @else {
          <a
            mat-tab-link
            (click)="activeLink = link; navigateTo(link.link)"
            [active]="activeLink == link"
            class="nav-link-container"
          >
            <mat-icon class="nav-icon">{{ link.icon }}</mat-icon>
            <span i18n="Navigation link@@nav.{{ link.nameKey }}">{{
              getTranslatedName(link.nameKey)
            }}</span>
          </a>
        }
      } -->

      <a
        mat-tab-link
        (click)="activeLink = links[0]; navigateTo(links[0].link)"
        [active]="activeLink === links[0]"
      >
        <mat-icon class="nav-icon">{{ links[0].icon }}</mat-icon>
        <span i18n="@@nav.about">{{ links[0].nameKey }}</span>
      </a>

      <a
        mat-tab-link
        (click)="activeLink = links[1]; navigateTo(links[1].link)"
        [active]="activeLink === links[1]"
        class="nav-link-container"
      >
        <mat-icon class="nav-icon">{{ links[1].icon }}</mat-icon>
        <span i18n="@@nav.objectives">{{ links[1].nameKey }}</span>
      </a>

      <a
        mat-tab-link
        (click)="activeLink = links[2]; navigateTo(links[2].link)"
        [active]="activeLink == links[2]"
        class="nav-link-container"
      >
        <mat-icon class="nav-icon" svgIcon="github"></mat-icon>
        <span i18n="@@nav.github">GitHub</span>
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

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private router: Router
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
      about: $localize`:@@nav.about:About`,
      objectives: $localize`:@@nav.objectives:Objectives`,
      github: $localize`:@@nav.github:GitHub`
    };
    return translations[key] || key;
  }

  navigateTo(link: string) {
    this.router.navigate([link]);
  }
}
