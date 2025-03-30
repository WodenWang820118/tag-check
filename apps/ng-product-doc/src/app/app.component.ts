import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgComponentOutlet, NgIf } from '@angular/common';
import { Meta } from '@angular/platform-browser';

@Component({
  imports: [RouterOutlet, NgComponentOutlet, AsyncPipe, NgIf],
  standalone: true,
  selector: 'app-root',
  template: `
    <div class="app-container">
      <ng-container *ngIf="toolbarComponent | async as toolbar">
        <ng-container
          *ngComponentOutlet="toolbar; inputs: toolbarInputs"
        ></ng-container>
      </ng-container>
      <div class="app-content">
        <router-outlet />
      </div>
    </div>
    @defer (on viewport) {
      @if (footerComponent | async) {
        <ng-container
          *ngComponentOutlet="footerComponent | async"
        ></ng-container>
      }
    } @placeholder {
      <div></div>
    }
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }
      .app-content {
        flex: 1;
        overflow: hidden;
      }
    `
  ]
})
export class AppComponent implements OnInit {
  title = 'TagCheck';
  toolbarComponent = this.loadToolbarComponent();
  footerComponent = this.loadFooterComponent();
  toolbarInputs = {
    title: this.title,
    aboutDisabled: true,
    objectivesDisabled: false
  };

  constructor(
    private router: Router,
    private metaService: Meta,
    @Inject(LOCALE_ID) public locale: string
  ) {}

  ngOnInit() {
    this.router.navigate(['/documentation']);
    this.addMetaTags();
  }

  private async loadToolbarComponent() {
    try {
      const module = await import('@ui');
      return module.ToolBarComponent;
    } catch (error) {
      console.error('Failed to load toolbar component:', error);
      return null;
    }
  }

  private async loadFooterComponent() {
    const module = await import('@ui');
    return module.FooterComponent;
  }

  addMetaTags(): void {
    this.metaService.addTags([
      {
        name: 'description',
        content:
          'TagCheck validates your GTM configuration to ensure accurate data measurement. Help digital marketers focus on insights rather than technical setup, reducing errors and streamlining tag management.'
      },
      // Keywords (less important for Google but kept for other engines)
      {
        name: 'keywords',
        content:
          'GTM Validation, Tag Audit, Google Tag Manager, TagCheck, Data Measurement, Tag Quality Assurance, Digital Analytics, Marketing Tags'
      },
      // Essential viewport tag for mobile optimization
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      // Canonical URL with proper format
      {
        rel: 'canonical',
        href: 'https://tag-check-documentation.vercel.app'
      },
      // Open Graph tags for social sharing
      {
        property: 'og:title',
        content: 'TagCheck | GTM Validation & Audit Tool for Digital Marketers'
      },
      {
        property: 'og:description',
        content:
          'Validate your GTM setup with TagCheck. Ensure accurate data measurement, reduce implementation errors, and focus on insights rather than technical configuration.'
      },
      {
        property: 'og:url',
        content: 'https://tag-check-documentation.vercel.app'
      },
      {
        property: 'og:type',
        content: 'website'
      },
      {
        property: 'og:image',
        content:
          'https://tag-check-documentation.vercel.app/assets/images/tagcheck-og.png'
      },
      {
        property: 'og:image:width',
        content: '1200'
      },
      {
        property: 'og:image:height',
        content: '630'
      },
      // Twitter Card tags
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:title',
        content: 'TagCheck | GTM Validation & Audit Tool for Digital Marketers'
      },
      {
        name: 'twitter:description',
        content:
          'Validate your GTM setup with TagCheck. Ensure accurate data measurement, reduce implementation errors, and focus on insights rather than technical configuration.'
      },
      {
        name: 'twitter:image',
        content:
          'https://tag-check-documentation.vercel.app/assets/images/tagcheck-og.png'
      },
      // Language specification
      {
        'http-equiv': 'content-language',
        content: 'en'
      },
      // Optional: Add author information
      {
        name: 'author',
        content: 'TagCheck Team'
      }
    ]);
  }
}
