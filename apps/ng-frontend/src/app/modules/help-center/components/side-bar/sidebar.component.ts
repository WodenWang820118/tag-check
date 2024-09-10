import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { MatTreeNestedDataSource, MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NestedTreeControl } from '@angular/cdk/tree';
import { TREE_DATA } from '../../tree-data';
import { TopicNode } from '@utils';
import { TreeNodeService } from '../../../../shared/services/tree-node/tree-node.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatTreeModule, MatIconModule, MatButtonModule],
  templateUrl: 'sidebar.component.html',
  styleUrls: ['sidebar.component.scss'],
})
export class SideBarComponent implements OnDestroy {
  destroy$ = new Subject<void>();
  treeControl = new NestedTreeControl<TopicNode>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<TopicNode>();
  selectedNodeContent: string = '';

  constructor(public treeNodeService: TreeNodeService) {
    this.dataSource.data = TREE_DATA;
  }

  hasChild = (_: number, node: TopicNode) =>
    !!node.children && node.children.length > 0;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
