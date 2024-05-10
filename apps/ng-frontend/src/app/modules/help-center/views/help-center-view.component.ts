import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, take, tap } from 'rxjs';
import { SideBarComponent } from '../components/side-bar/side-bar.component';
import { RouterOutlet } from '@angular/router';
import { TreeNodeService } from '../../../shared/services/tree-node/tree-node.service';
import { TopicNode } from '@utils';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-help-center-view',
  standalone: true,
  imports: [AsyncPipe, SideBarComponent, RouterOutlet, MatButtonModule],
  templateUrl: 'help-center-view.component.html',
  styleUrls: ['help-center-view.component.scss'],
})
export class HelpCenterViewComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  currentNode$!: Observable<TopicNode>;
  currentNodeId: number = 0;

  constructor(public treeNodeService: TreeNodeService) {}

  ngOnInit(): void {
    this.currentNode$ = this.treeNodeService.getCurrentNode().pipe(
      tap((node) => {
        this.currentNodeId = node.id;
      })
    );
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
