import { MatListModule } from '@angular/material/list';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
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
import { NgClass } from '@angular/common';

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

  // Create writable signals for state
  private readonly fileNameSignal = signal<string>('');
  private readonly tocSignal = signal<{ id: string; text: string }[]>([]);

  // Create computed signals for derived state
  readonly fileName = computed(() => this.fileNameSignal());
  readonly toc = computed(() => this.tocSignal());

  // Expose tree data and accessor for the template
  readonly treeData = this.treeNodeService.treeData;
  readonly childrenAccessor = this.treeNodeService.childrenAccessor;

  // Expose navigation properties
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
        const fileName = fullData['fileName'] as string;
        this.fileNameSignal.set(fileName);
        console.log('Loaded markdown file:', fileName);
        this.tocSignal.set([]);
      });
  }

  scrollToSection(sectionId: string) {
    console.log('Scrolling to section:', sectionId);
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop() {
    this.activeSection = null;
    this.scrollToSection('markdown');
  }

  onMarkdownReady() {
    // Clear the TOC first
    this.tocSignal.set([]);

    // Get all heading elements from the rendered markdown
    const h1Elements = document.querySelectorAll('#markdown h1');
    const h2Elements = document.querySelectorAll('#markdown h2');
    const headElements = Array.from(h1Elements).concat(Array.from(h2Elements));

    // Create TOC entries from the heading elements
    const newToc = headElements.map((element) => {
      const text = element.textContent || '';
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');

      // Set the ID on the element for linking
      element.id = id;

      return { id, text };
    });

    this.tocSignal.set(newToc);
  }
}
