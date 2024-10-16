import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, switchMap, take, tap } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownService } from 'ngx-markdown';
import { ViewportScroller, AsyncPipe } from '@angular/common';
import { TopicNode } from '@utils';
import { TreeNodeService } from '../../../../shared/services/tree-node/tree-node.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [AsyncPipe, MarkdownModule, MatButtonModule],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class MainContentComponent implements OnInit {
  currentNode$!: Observable<TopicNode>;
  @Input() currentNodeId: number = 0;
  @Input() fileName: string = '';
  @Input() toc: { id: string; text: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private markdownService: MarkdownService,
    private viewportScroller: ViewportScroller,
    public treeNodeService: TreeNodeService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        map((param) => {
          const name = param['name'].toLowerCase();
          this.fileName = `assets/${name}.md`;
          return this.fileName;
        }),
        switchMap((fileName) => this.markdownService.getSource(fileName)),
        tap((content) => {
          this.toc = [];
          this.generateTOC(content); // Generate TOC based on the content
        }),
        catchError((error) => {
          // TODO: 404 page
          console.error('Error: ', error);
          this.fileName = 'assets/404.md';
          return error;
        })
      )
      .subscribe();

    this.currentNode$ = this.treeNodeService.getCurrentNode().pipe(
      tap((node) => {
        this.currentNodeId = node.id;
      })
    );
  }

  generateTOC(content: string) {
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length; // Number of '#' indicates the heading level
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w]+/g, '-'); // Create an ID for the heading
      this.toc.push({ id, text });
    }
  }

  getPreviousArticle() {
    this.treeNodeService
      .getCurrentNode()
      .pipe(
        take(1),
        tap((node) => {
          const prevNode = this.treeNodeService.searchNodeById(node.id - 1);
          if (prevNode) {
            this.treeNodeService.navigateToNode(prevNode);
          }
        })
      )
      .subscribe();
  }

  getNextArticle() {
    this.treeNodeService
      .getCurrentNode()
      .pipe(
        take(1),
        tap((node) => {
          const nextNode = this.treeNodeService.searchNodeById(node.id + 1);
          if (nextNode) {
            this.treeNodeService.navigateToNode(nextNode);
          }
        })
      )
      .subscribe();
  }

  scrollToSection(sectionId: string) {
    this.viewportScroller.scrollToAnchor(sectionId);
  }

  onMarkdownReady() {
    const h1Elements = document.querySelectorAll('h1');
    const h2Elements = document.querySelectorAll('h2');
    const headElements = Array.from(h1Elements).concat(Array.from(h2Elements));
    for (let i = 0; i < headElements.length; i++) {
      const h1Element = headElements[i] as HTMLElement;
      const text = headElements[i].textContent;
      for (let j = 0; j < this.toc.length; j++) {
        if (this.toc[j].text === text) {
          h1Element.id = this.toc[j].id;
          break;
        }
      }
    }
  }
}
