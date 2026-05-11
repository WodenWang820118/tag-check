import { AsyncPipe, NgComponentOutlet } from '@angular/common';
import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import type { ToolbarInputs } from '@ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, NgComponentOutlet],
  template: `
    @defer {
      @if (toolbarComponent | async; as toolbar) {
        <ng-container
          [ngComponentOutlet]="toolbar"
          [ngComponentOutletInputs]="toolbarInputs"
        ></ng-container>
      }
    } @placeholder {
      <div class="toolbar-placeholder">Loading toolbar...</div>
    }

    <div class="app">
      <router-outlet></router-outlet>
    </div>

    @defer (on viewport) {
      @if (footerComponent | async; as footer) {
        <ng-container [ngComponentOutlet]="footer"></ng-container>
      }
    } @placeholder {
      <div></div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100dvh;
      }
      .app {
        flex: 1 1 auto;
        width: 100%;
        padding-block: clamp(1rem, 3vw, 3rem);
        /* Horizontal padding lives on the inner views so the workspace
           page can stretch to its own max-w-[1440px] while content
           pages stay narrow. The inner views also own the <main>
           landmark to avoid duplicate landmarks at this shell level. */
      }
      .toolbar-placeholder {
        min-height: 4rem;
      }
    `
  ]
})
export class AppComponent implements OnInit {
  title = 'Tag Build';
  toolbarComponent = this.loadToolbarComponent();
  footerComponent = this.loadFooterComponent();
  toolbarInputs = { title: this.title } satisfies ToolbarInputs;

  constructor(
    private readonly metaService: Meta,
    @Inject(LOCALE_ID) public locale: string
  ) {}

  ngOnInit(): void {
    this.addMetaTags();
  }

  private async loadToolbarComponent() {
    const module = await import('@ui');
    return module.ToolBarComponent;
  }

  private async loadFooterComponent() {
    const module = await import('@ui');
    return module.FooterComponent;
  }

  addMetaTags(): void {
    this.metaService.addTags([
      {
        name: 'description',
        content: `Tag Build automates GTM configuration, creating accurate JSON files for digital marketers and SEO experts.
          Streamline tag management, reduce errors, and boost productivity.`
      },
      // Google no longer uses keywords meta tag, but keeping for other search engines
      {
        name: 'keywords',
        content:
          'Google Tag Manager, GTM Automation, Tag Build, JSON Configuration, SEO Tools, Digital Marketing, Tag Management'
      },
      // Viewport tag for mobile optimization
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      // Canonical URL with proper format
      {
        rel: 'canonical',
        href: 'https://tag-build.vercel.app'
      },
      // Open Graph tags for social sharing
      {
        property: 'og:title',
        content: 'Tag Build | Effortless GTM Configuration and Management'
      },
      {
        property: 'og:description',
        content: `Automate your GTM configuration with Tag Build. Create accurate JSON files, streamline tag management,
          and enhance productivity for digital marketers and SEO experts.`
      },
      {
        property: 'og:url',
        content: 'https://tag-build.vercel.app'
      },
      {
        property: 'og:type',
        content: 'website'
      },
      {
        property: 'og:image',
        content: 'https://tag-build.vercel.app/assets/images/tagbuild-og.png'
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
        content: 'Tag Build | Effortless GTM Configuration and Management'
      },
      {
        name: 'twitter:description',
        content: `Automate your GTM configuration with Tag Build. Create accurate JSON files, streamline tag management,
          and enhance productivity for digital marketers and SEO experts.`
      },
      {
        name: 'twitter:image',
        content: 'https://tag-build.vercel.app/assets/images/twitter-image.jpg' // Replace with your actual image path
      },
      // Optional: Add language tag if your site is multilingual
      {
        'http-equiv': 'content-language',
        content: 'en'
      }
    ]);
  }
}
