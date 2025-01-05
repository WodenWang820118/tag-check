import { Component } from '@angular/core';
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
  styleUrls: ['sidebar.component.scss']
})
export class SideBarComponent {
  treeControl = new NestedTreeControl<TopicNode>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<TopicNode>();

  constructor(private treeNodeService: TreeNodeService) {
    this.dataSource.data = TREE_DATA;
  }

  hasChild = (_: number, node: TopicNode) =>
    !!node.children && node.children.length > 0;

  onNodeClick(node: TopicNode) {
    this.treeNodeService.navigateToNode(node);
  }
}
