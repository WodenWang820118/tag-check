import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { MatTreeNestedDataSource, MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NestedTreeControl } from '@angular/cdk/tree';
import { TopicNode, TREE_DATA } from '../../tree-data';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
  ],
  templateUrl: 'side-bar.component.html',
  styleUrls: ['side-bar.component.scss'],
})
export class SideBarComponent implements OnDestroy {
  destroy$ = new Subject<void>();
  treeControl = new NestedTreeControl<TopicNode>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<TopicNode>();
  selectedNodeContent: string = '';

  constructor() {
    this.dataSource.data = TREE_DATA;
  }

  hasChild = (_: number, node: TopicNode) =>
    !!node.children && node.children.length > 0;

  onNodeClick(nodeName: string): void {
    // Your logic to show contents based on node name
    // For demonstration, I'll simply set the selectedNodeContent
    this.selectedNodeContent = `Contents related to ${nodeName}`;
    console.log(this.selectedNodeContent);
    console.log(nodeName);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
