import { TREE_DATA } from './tree-data';

describe('TREE_DATA', () => {
  it('contains the expected top-level sections', () => {
    expect(TREE_DATA.map((n) => n.name)).toEqual([
      'Introduction',
      'Get Started',
      'Projects',
      'Settings'
    ]);
  });

  it('every leaf node defines a route', () => {
    const leaves: { name: string; route?: string }[] = [];
    function collect(nodes: typeof TREE_DATA): void {
      for (const n of nodes) {
        if (n.children?.length) {
          collect(n.children as typeof TREE_DATA);
        } else {
          leaves.push(n);
        }
      }
    }
    collect(TREE_DATA);
    expect(leaves.length).toBeGreaterThan(0);
    for (const leaf of leaves) {
      expect(typeof leaf.route).toBe('string');
      expect(leaf.route!.length).toBeGreaterThan(0);
    }
  });

  it('all node ids are unique', () => {
    const ids: number[] = [];
    function walk(nodes: typeof TREE_DATA): void {
      for (const n of nodes) {
        ids.push(n.id);
        if (n.children) walk(n.children as typeof TREE_DATA);
      }
    }
    walk(TREE_DATA);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
