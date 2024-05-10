import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { MatTreeNestedDataSource, MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NestedTreeControl } from '@angular/cdk/tree';
import { TREE_DATA } from '../../tree-data';
import { TopicNode } from '@utils';
import { TreeNodeService } from '../../../../shared/services/tree-node/tree-node.service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [MatTreeModule, MatIconModule, MatButtonModule],
  templateUrl: 'side-bar.component.html',
  styleUrls: ['side-bar.component.scss'],
})
export class SideBarComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  treeControl = new NestedTreeControl<TopicNode>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<TopicNode>();
  selectedNodeContent: string = '';

  constructor(public treeNodeService: TreeNodeService) {
    this.dataSource.data = TREE_DATA;
  }

  hasChild = (_: number, node: TopicNode) =>
    !!node.children && node.children.length > 0;

  ngOnInit(): void {
    // the landing page should be the first topic in the tree
    const landingPageNode = TREE_DATA[0];
    this.treeNodeService.navigateToNode(landingPageNode);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
