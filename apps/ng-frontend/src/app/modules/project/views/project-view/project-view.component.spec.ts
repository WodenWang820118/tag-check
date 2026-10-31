import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ProjectViewComponent } from './project-view.component';

/** Renders the view's logic without its toolbar and menu. */
function create(wide: boolean) {
  const observer = {
    observe: vi.fn(() => of({ matches: wide, breakpoints: {} })),
    isMatched: vi.fn(() => wide)
  };
  const router = { navigate: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: BreakpointObserver, useValue: observer },
      {
        provide: ActivatedRoute,
        useValue: { data: of({}), snapshot: { data: {} } }
      },
      { provide: Router, useValue: router }
    ]
  });
  TestBed.overrideComponent(ProjectViewComponent, {
    set: { imports: [], template: '' }
  });
  const component =
    TestBed.createComponent(ProjectViewComponent).componentInstance;
  return { component, observer, router };
}

describe('ProjectViewComponent', () => {
  it('keeps the menu beside the content only from 1280px wide', () => {
    const { component, observer } = create(true);

    expect(observer.observe).toHaveBeenCalledWith('(min-width: 1280px)');
    expect(component.isWide()).toBe(true);
  });

  it('closes the sliding menu after a choice in a narrow window', () => {
    const { component, router } = create(false);
    const menu = { close: vi.fn() };

    component.onChangeProject('shop', menu as never);

    expect(menu.close).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/projects', 'shop']);
  });

  it('leaves the side menu open after a choice in a wide window', () => {
    const { component } = create(true);
    const menu = { close: vi.fn() };

    component.closeOverlayMenu(menu as never);

    expect(menu.close).not.toHaveBeenCalled();
  });
});
