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
import { MarkdownModule } from 'ngx-markdown';
import { TreeNodeService } from '../../services/tree-node/tree-node.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { DOCUMENT, NgClass, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [
    MarkdownModule,
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
  public treeNodeService = inject(TreeNodeService);
  public route = inject(ActivatedRoute);
  private readonly destroyedRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly fileNameSignal = signal<string>('');
  private readonly contentSignal = signal<string>('');
  private readonly tocSignal = signal<{ id: string; text: string }[]>([]);

  readonly fileName = computed(() => this.fileNameSignal());
  readonly content = computed(() => this.contentSignal());
  readonly toc = computed(() => this.tocSignal());

  readonly treeData = this.treeNodeService.treeData;
  readonly childrenAccessor = this.treeNodeService.childrenAccessor;

  readonly currentNodeId = computed(() => this.treeNodeService.currentNodeId());
  readonly hasPrevious = computed(
    () => !!this.treeNodeService.getPreviousNode()
  );
  readonly hasNext = computed(() => !!this.treeNodeService.getNextNode());
  activeSection: string | null = null;

  ngOnInit() {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyedRef))
      .subscribe((data) => {
        const fullData = data['data'];
        this.fileNameSignal.set((fullData['fileName'] as string) ?? '');
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

  onMarkdownReady() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.tocSignal.set([]);
    const h1Elements = this.document.querySelectorAll('#markdown h1');
    const h2Elements = this.document.querySelectorAll('#markdown h2');
    const headElements = Array.from(h1Elements).concat(Array.from(h2Elements));

    const newToc = headElements.map((element) => {
      const text = element.textContent || '';
      const id = text.toLowerCase().replaceAll(/[^\w]+/g, '-');
      element.id = id;

      return { id, text };
    });

    this.tocSignal.set(newToc);
  }
}
