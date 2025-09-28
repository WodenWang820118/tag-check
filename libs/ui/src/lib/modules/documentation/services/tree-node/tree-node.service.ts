import { Injectable, signal, computed } from '@angular/core';
import { TopicNode } from '@utils';
import { TREE_DATA } from '../../tree-data';

@Injectable({
  providedIn: 'root'
})
export class TreeNodeService {
  private readonly CACHE_KEY = 'currentTreeNode';

  private readonly treeDataSignal = signal<TopicNode[]>(TREE_DATA);
  readonly treeData = computed(() => this.treeDataSignal());

  private readonly currentNodeSignal = signal<TopicNode>(TREE_DATA[0]);
  readonly currentNode = computed(() => this.currentNodeSignal());
  readonly currentNodeId = computed(() => this.currentNode().id);

  // Define the childrenAccessor function
  readonly childrenAccessor = (node: TopicNode): TopicNode[] =>
    node.children || [];

  // Node index for quick lookups
  private readonly nodeIndex: Map<number, TopicNode> = new Map();

  constructor() {
    this.buildNodeIndex(TREE_DATA);
  }

  // Get the next node in a flattened tree traversal
  getNextNode(): TopicNode | null {
    const flatNodes = this.getFlattenedNodes();
    const currentIndex = flatNodes.findIndex(
      (node) => node.id === this.currentNodeId()
    );

    if (currentIndex >= 0 && currentIndex < flatNodes.length - 1) {
      return flatNodes[currentIndex + 1];
    }
    return null;
  }

  // Get the previous node in a flattened tree traversal
  getPreviousNode(): TopicNode | null {
    const flatNodes = this.getFlattenedNodes();
    const currentIndex = flatNodes.findIndex(
      (node) => node.id === this.currentNodeId()
    );

    if (currentIndex > 0) {
      return flatNodes[currentIndex - 1];
    }
    return null;
  }

  // Flatten the tree for sequential navigation
  private getFlattenedNodes(): TopicNode[] {
    const result: TopicNode[] = [];

    const traverse = (nodeList: TopicNode[]) => {
      for (const node of nodeList) {
        // Only include nodes that represent actual content (not just categories)
        if (node.route || !node.children || node.children.length === 0) {
          result.push(node);
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };

    traverse(TREE_DATA);
    return result;
  }

  getSelectedTitle(nodeName: string): string {
    return nodeName.toLowerCase().replaceAll(' ', '-');
  }

  searchNodeById(id: number): TopicNode | null {
    return this.nodeIndex.get(id) || null;
  }

  setCurrentNode(node: TopicNode): void {
    this.currentNodeSignal.set(node);
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(node));
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
    let maxId = 0;
    this.nodeIndex.forEach((_, id) => {
      if (id > maxId) maxId = id;
    });
    return maxId;
  }

  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
}
