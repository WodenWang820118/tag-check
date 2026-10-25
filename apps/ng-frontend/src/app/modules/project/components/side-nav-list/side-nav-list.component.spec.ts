import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { navSectionOf, SideNavListComponent } from './side-nav-list.component';

describe('navSectionOf', () => {
  it('highlights Tests on the tests list and on a test page', () => {
    expect(navSectionOf('/projects/shop')).toBe('tests');
    expect(navSectionOf('/projects/shop/')).toBe('tests');
    expect(
      navSectionOf('/projects/shop/0fd9ce76-5792-4191-8fba-8bb20e3013bc?tab=1')
    ).toBe('tests');
  });

  it('highlights the section a page belongs to', () => {
    expect(navSectionOf('/projects/shop/tag-build')).toBe('tagbuild');
    expect(navSectionOf('/projects/shop/buckets')).toBe('reports');
    expect(navSectionOf('/projects/shop/schedules')).toBe('schedules');
    expect(navSectionOf('/projects/shop/settings/gtm')).toBe('settings');
    expect(navSectionOf('/projects/shop/settings/project-io#top')).toBe(
      'settings'
    );
  });

  it('falls back to Tests outside a project', () => {
    expect(navSectionOf('/')).toBe('tests');
  });
});

@Component({ template: '' })
class PageStubComponent {}

describe('SideNavListComponent', () => {
  async function renderAt(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: '**', component: PageStubComponent }])
      ]
    });
    const openedChange = new Subject<boolean>();
    const fixture = TestBed.createComponent(SideNavListComponent);
    fixture.componentRef.setInput('snav', { openedChange } as never);
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    const highlighted = (testId: string) =>
      (
        fixture.nativeElement.querySelector(
          `[data-testid="${testId}"]`
        ) as HTMLElement
      ).classList.contains('secondary');
    return { fixture, openedChange, highlighted };
  }

  it('highlights Reports after navigating to the runs list', async () => {
    const { highlighted } = await renderAt('/projects/shop/buckets');

    expect(highlighted('nav-reports')).toBe(true);
    expect(highlighted('nav-tests')).toBe(false);
  });

  it('highlights Settings on a settings page', async () => {
    const { highlighted } = await renderAt('/projects/shop/settings/gtm');

    expect(highlighted('nav-settings')).toBe(true);
    expect(highlighted('nav-reports')).toBe(false);
  });

  it('closes the settings menu when the side nav closes', async () => {
    const { fixture, openedChange } = await renderAt('/projects/shop');
    fixture.componentInstance.toggleSettings();
    expect(fixture.componentInstance.isOpen()).toBe(true);

    openedChange.next(false);

    expect(fixture.componentInstance.isOpen()).toBe(false);
  });
});
