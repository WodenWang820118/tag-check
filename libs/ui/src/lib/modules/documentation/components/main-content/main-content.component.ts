import { MatListModule } from '@angular/material/list';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  PLATFORM_ID
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MarkdownComponent } from 'ngx-markdown';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { DOCUMENT, NgClass, isPlatformBrowser } from '@angular/common';
import { buildHeadingIds } from './heading-ids';

/**
 * Renders the markdown the documentation resolver loaded for the route, with
 * an "On This Page" list of its h1 and h2 headings.
 */
@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [
    MarkdownComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    NgScrollbarModule,
    NgClass
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainContentComponent {
  public route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly routeData = toSignal(this.route.data);

  private readonly contentSignal = computed(() => {
    const data = this.routeData();
    const fullData = data
      ? (data['data'] as { content?: string } | undefined)
      : undefined;
    return fullData?.content ?? '';
  });

  private readonly tocSignal = linkedSignal<
    string,
    { id: string; text: string }[]
  >({
    source: this.contentSignal,
    computation: () => []
  });

  readonly content = computed(() => this.contentSignal());
  readonly toc = computed(() => this.tocSignal());

  activeSection: string | null = null;

  scrollToSection(sectionId: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.activeSection = sectionId;
    const element = this.document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop() {
    this.activeSection = null;
    this.scrollToSection('markdown');
  }

  /** Gives the rendered headings ids and lists them in document order. */
  onMarkdownReady() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const headings = Array.from(
      this.document.querySelectorAll('#markdown h1, #markdown h2')
    );
    const texts = headings.map((element) => element.textContent ?? '');
    const ids = buildHeadingIds(texts);
    headings.forEach((element, index) => {
      element.id = ids[index];
    });
    this.tocSignal.set(texts.map((text, index) => ({ id: ids[index], text })));
  }
}
