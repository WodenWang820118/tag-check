import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  OnInit,
  signal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MarkdownModule } from 'ngx-markdown';
import { ViewportScroller } from '@angular/common';
import { TopicNode } from '@utils';
import { TreeNodeService } from '../../../../shared/services/tree-node/tree-node.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [MarkdownModule, MatButtonModule],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainContentComponent implements OnInit {
  readonly currentNode = toSignal(this.treeNodeService.getCurrentNode(), {
    initialValue: {} as TopicNode
  });

  // Create writable signals for state
  private readonly currentNodeIdSignal = signal<number>(0);
  private readonly fileNameSignal = signal<string>('');
  private readonly tocSignal = signal<{ id: string; text: string }[]>([]);

  // Create computed signals for derived state
  readonly fileName = computed(() => this.fileNameSignal());
  readonly toc = computed(() => this.tocSignal());
  readonly currentNodeId = computed(() => this.currentNodeIdSignal());

  constructor(
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    public treeNodeService: TreeNodeService,
    private destroyedRef: DestroyRef
  ) {
    // Update currentNodeId when currentNode changes
    effect(() => {
      const node = this.currentNode();
      if (node?.id) {
        this.currentNodeIdSignal.set(node.id);
      }
    });
  }

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

  getPreviousArticle() {
    const currentId = this.currentNodeId();
    const prevNode = this.treeNodeService.searchNodeById(currentId - 1);
    if (prevNode) {
      this.treeNodeService.navigateToNode(prevNode);
    }
  }

  getNextArticle() {
    const currentId = this.currentNodeId();
    const nextNode = this.treeNodeService.searchNodeById(currentId + 1);
    if (nextNode) {
      this.treeNodeService.navigateToNode(nextNode);
    }
  }

  scrollToSection(sectionId: string) {
    this.viewportScroller.scrollToAnchor(sectionId);
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
