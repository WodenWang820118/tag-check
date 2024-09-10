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

  currentNode: Subject<TopicNode> = new BehaviorSubject<TopicNode>({
    id: 0,
    name: '',
    children: [],
  });

  currentNode$ = this.currentNode.asObservable();
  private nodeIndex: Map<number, TopicNode> = new Map();

  constructor(private router: Router) {
    this.buildNodeIndex(TREE_DATA);
    this.initializeFromCache();
  }

  private initializeFromCache(): void {
    const cachedNode = localStorage.getItem(this.CACHE_KEY);
    if (cachedNode) {
      try {
        const parsedNode: TopicNode = JSON.parse(cachedNode);
        this.navigateToNode(parsedNode);
      } catch (error) {
        console.error('Error parsing cached node:', error);
        localStorage.removeItem(this.CACHE_KEY);
      }
    }
  }

  getSelectedTitle(nodeName: string) {
    return nodeName.toLowerCase().replace(/ /g, '-');
  }

  navigateToNode(node: TopicNode) {
    this.setCurrentNode(node);
    this.router.navigate(['topics', this.getSelectedTitle(node.name)], {});
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

  setCurrentNode(node: TopicNode, cache: boolean = true) {
    this.currentNode.next(node);
    if (cache) {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(node));
    }
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
