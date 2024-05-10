import { Injectable } from '@angular/core';
import { TopicNode } from '@utils';
import { BehaviorSubject, Subject } from 'rxjs';
import { TREE_DATA } from '../../../modules/help-center/tree-data';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class TreeNodeService {
  currentNode: Subject<TopicNode> = new BehaviorSubject<TopicNode>({
    id: 0,
    name: '',
    children: [],
  });

  currentNode$ = this.currentNode.asObservable();
  private nodeIndex: Map<number, TopicNode> = new Map();

  constructor(private router: Router) {
    this.buildNodeIndex(TREE_DATA);
  }

  getSelectedTitle(nodeName: string) {
    // convert the node name to lowercase and replace spaces with hyphens
    return nodeName.toLowerCase().replace(/ /g, '-');
  }

  navigateToNode(node: TopicNode) {
    this.setCurrentNode(node);
    this.router.navigate(['topics', this.getSelectedTitle(node.name)]);
  }

  searchNodeByName(nodes: TopicNode[], nodeName: string): TopicNode | null {
    for (const node of nodes) {
      if (node.name === nodeName) {
        return node;
      }
      if (node.children) {
        const foundNode = this.searchNodeByName(node.children, nodeName);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return null;
  }

  searchNodeById(id: number): TopicNode | null {
    return this.nodeIndex.get(id) || null;
  }

  setCurrentNode(node: TopicNode) {
    this.currentNode.next(node);
  }

  getCurrentNode() {
    return this.currentNode.asObservable();
  }

  convertFileNameToNodeName(fileName: string) {
    const name = (fileName.split('/').pop() as string).split('.')[0];
    return name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private buildNodeIndex(nodes: TopicNode[]): void {
    for (const node of nodes) {
      this.nodeIndex.set(node.id, node);
      if (node.children) {
        this.buildNodeIndex(node.children);
      }
    }
  }

  getMaxId(): number {
    // there are nodes are having the same id as -1, indicating that they have children
    // after building index, the size will always be greater than the max id + 1
    return this.nodeIndex.size - 1;
  }
}
