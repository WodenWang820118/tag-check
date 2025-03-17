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
import { TopicNode } from '@utils';
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
  private destroyedRef = inject(DestroyRef);

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
        const content = fullData['content'] as string;
        this.fileNameSignal.set(fileName);
        console.log('Loaded markdown file:', fileName);
        this.tocSignal.set([]);
        this.generateTOC(content);
      });
  }

  // Rest of your component methods...
  generateTOC(content: string) {
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    const newToc: { id: string; text: string }[] = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      newToc.push({ id, text });
    }
    this.tocSignal.set(newToc);
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
    const h1Elements = document.querySelectorAll('h1');
    const h2Elements = document.querySelectorAll('h2');
    const headElements = Array.from(h1Elements).concat(Array.from(h2Elements));
    const currentToc = this.toc();
    for (const element of headElements) {
      const text = element.textContent;
      const tocEntry = currentToc.find((entry) => entry.text === text);
      if (tocEntry) {
        (element as HTMLElement).id = tocEntry.id;
      }
    }
  }
}
