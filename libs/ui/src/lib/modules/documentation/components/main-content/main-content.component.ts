import { MatListModule } from '@angular/material/list';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  OnInit,
  signal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class MainContentComponent implements OnInit {
  public route = inject(ActivatedRoute);
  private readonly destroyedRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly contentSignal = signal<string>('');
  private readonly tocSignal = signal<{ id: string; text: string }[]>([]);

  readonly content = computed(() => this.contentSignal());
  readonly toc = computed(() => this.tocSignal());

  activeSection: string | null = null;

  ngOnInit() {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyedRef))
      .subscribe((data) => {
        const fullData = data['data'];
        this.contentSignal.set((fullData['content'] as string) ?? '');
        this.tocSignal.set([]);
      });
  }

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
