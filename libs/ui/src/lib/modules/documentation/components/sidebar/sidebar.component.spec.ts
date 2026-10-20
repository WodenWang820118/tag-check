import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SideBarComponent } from './sidebar.component';
import { TREE_DATA } from '../../tree-data';
import type { TopicNode } from '@utils';

const node = (id: number, children?: TopicNode[]): TopicNode => ({
  id,
  name: `topic-${id}`,
  children
});

describe('SideBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideBarComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();
  });

  it('exposes the documentation tree as its data source', () => {
    const fixture = TestBed.createComponent(SideBarComponent);
    expect(fixture.componentInstance.dataSource).toBe(TREE_DATA);
  });

  it('childrenAccessor returns child nodes or an empty array', () => {
    const fixture = TestBed.createComponent(SideBarComponent);
    expect(fixture.componentInstance.childrenAccessor(node(1))).toEqual([]);
    const children = [node(2)];
    expect(fixture.componentInstance.childrenAccessor(node(1, children))).toBe(
      children
    );
  });

  it('hasChild reports true only when children are non-empty', () => {
    const c = TestBed.createComponent(SideBarComponent).componentInstance;
    expect(c.hasChild(0, node(1))).toBe(false);
    expect(c.hasChild(0, node(1, []))).toBe(false);
    expect(c.hasChild(0, node(1, [node(2)]))).toBe(true);
  });
});
