import { Injectable } from '@angular/core';
import { TopicNode } from '@utils';
import { BehaviorSubject, Subject } from 'rxjs';
import { TREE_DATA } from '../../../modules/help-center/tree-data';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class TreeNodeService {
  private readonly CACHE_KEY = 'currentTreeNode';

  currentNode: Subject<TopicNode> = new BehaviorSubject<TopicNode>(
    TREE_DATA[0]
  );

  currentNode$ = this.currentNode.asObservable();
  private nodeIndex: Map<number, TopicNode> = new Map();

  constructor(private router: Router) {
    this.buildNodeIndex(TREE_DATA);
  }

  initializeTreeNodes(): void {
    const cachedNode = localStorage.getItem(this.CACHE_KEY);
    if (cachedNode) {
      try {
        const parsedNode: TopicNode = JSON.parse(cachedNode);
        this.navigateToNode(parsedNode);
      } catch (error) {
        console.error('Error parsing cached node:', error);
        localStorage.removeItem(this.CACHE_KEY);
        this.navigateToInitialNode();
      }
    } else {
      this.navigateToInitialNode();
    }
  }

  private navigateToInitialNode(): void {
    const initialNode = this.searchNodeById(1) || TREE_DATA[0];
    if (initialNode) {
      this.navigateToNode(initialNode);
    } else {
      console.error('No initial node found');
    }
  }

  navigateToNode(node: TopicNode) {
    this.setCurrentNode(node);
    const url = ['topics', this.getSelectedTitle(node.name)];
    console.log('Navigating to URL:', url);
    this.router.navigate(url).then(
      (success) => {
        if (!success) {
          console.error('Navigation failed');
        }
      },
      (error) => {
        console.error('Navigation error:', error);
      }
    );
  }

  getSelectedTitle(nodeName: string) {
    return nodeName.toLowerCase().replace(/ /g, '-');
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
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(node));
  }

  resetCurrentNode() {
    this.currentNode.next(TREE_DATA[0]);
    localStorage.removeItem(this.CACHE_KEY);
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
    return this.nodeIndex.size - 1;
  }

  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
}
