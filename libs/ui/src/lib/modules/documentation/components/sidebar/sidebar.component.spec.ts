import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SideBarComponent } from './sidebar.component';
import { TREE_DATA } from '../../tree-data';

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
    expect(
      fixture.componentInstance.childrenAccessor({ id: 1 } as any)
    ).toEqual([]);
    const children = [{ id: 2 } as any];
    expect(
      fixture.componentInstance.childrenAccessor({ id: 1, children } as any)
    ).toBe(children);
  });

  it('hasChild reports true only when children are non-empty', () => {
    const c = TestBed.createComponent(SideBarComponent).componentInstance;
    expect(c.hasChild(0, { id: 1 } as any)).toBe(false);
    expect(c.hasChild(0, { id: 1, children: [] } as any)).toBe(false);
    expect(c.hasChild(0, { id: 1, children: [{ id: 2 }] } as any)).toBe(true);
  });
});
