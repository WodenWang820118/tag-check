import { Component } from '@angular/core';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TREE_DATA } from '../../tree-data';
import { TopicNode } from '@utils';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: 'sidebar.component.html',
  styleUrls: ['sidebar.component.scss']
})
export class SideBarComponent {
  childrenAccessor = (node: TopicNode) => node.children ?? [];
  hasChild = (_: number, node: TopicNode) =>
    !!node.children && node.children.length > 0;
  dataSource = TREE_DATA;
}
