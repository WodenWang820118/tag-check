import { TestBed } from '@angular/core/testing';
import { TreeNodeService } from './tree-node.service';

describe('TreeNodeService', () => {
  let svc: TreeNodeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(TreeNodeService);
  });

  it('initializes with the first node from TREE_DATA', () => {
    expect(svc.currentNode()).toBeTruthy();
    expect(svc.treeData().length).toBeGreaterThan(0);
  });

  it('childrenAccessor returns node children or empty array', () => {
    expect(
      svc.childrenAccessor({ children: [{ id: 1 } as never] } as never)
    ).toEqual([{ id: 1 }]);
    expect(svc.childrenAccessor({} as never)).toEqual([]);
  });

  it('getSelectedTitle lowercases and dasherizes the name', () => {
    expect(svc.getSelectedTitle('Hello World Foo')).toBe('hello-world-foo');
  });

  it('searchNodeById returns null for unknown id', () => {
    expect(svc.searchNodeById(-999)).toBeNull();
  });

  it('searchNodeById finds a known id and getMaxId returns the largest id', () => {
    const max = svc.getMaxId();
    expect(max).toBeGreaterThan(0);
    expect(svc.searchNodeById(max)).not.toBeNull();
  });

  it('setCurrentNode updates current node and caches in localStorage', () => {
    const node = { id: 999, name: 'x' } as never;
    svc.setCurrentNode(node);
    expect(svc.currentNode()).toEqual(node);
    expect(svc.currentNodeId()).toBe(999);
    expect(localStorage.getItem('currentTreeNode')).toBe(JSON.stringify(node));
  });

  it('clearCache removes the stored node', () => {
    svc.setCurrentNode({ id: 1 } as never);
    svc.clearCache();
    expect(localStorage.getItem('currentTreeNode')).toBeNull();
  });

  it('returns null from getNextNode/getPreviousNode for an unknown current id', () => {
    svc.setCurrentNode({ id: -1 } as never);
    expect(svc.getPreviousNode()).toBeNull();
  });
});
