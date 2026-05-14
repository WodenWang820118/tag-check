import '@angular/localize/init';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolBarComponent, type ToolbarInputs } from '../../../index';

describe('ToolbarInputs', () => {
  const primaryLink = {
    href: '/ja/app',
    label: 'App',
    icon: 'build',
    logicalPath: '/app',
    matchStrategy: 'exact'
  } as const;

  const docsLink = {
    href: 'https://tag-check-documentation.vercel.app/ja/documentation/introduction',
    label: 'Getting Started',
    icon: 'menu_book'
  } as const;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolBarComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'ja' },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('supports the minimal toolbar contract with a host-provided primary link', () => {
    const inputs: ToolbarInputs = {
      title: 'Tag Build',
      primaryLink
    };
    const fixture = renderToolbar(inputs);
    const [appLink, aboutLink, objectivesLink, githubLink] = getMenuLinks(
      fixture,
      4
    );

    expect(fixture.componentInstance.title()).toBe('Tag Build');
    expect(fixture.componentInstance.aboutDisabled()).toBe(false);
    expect(fixture.componentInstance.objectivesDisabled()).toBe(false);
    expect(getHomeLink(fixture).getAttribute('href')).toBe('/ja/');
    expect(appLink.getAttribute('href')).toBe('/ja/app');
    expect(aboutLink.getAttribute('href')).toBe('/ja/about');
    expect(objectivesLink.getAttribute('href')).toBe('/ja/objectives');
    expect(githubLink.getAttribute('target')).toBe('_blank');
  });

  it('supports optional toolbar visibility flags', () => {
    const inputs: ToolbarInputs = {
      title: 'TagCheck',
      primaryLink,
      docsLink,
      aboutDisabled: true,
      objectivesDisabled: false
    };
    const fixture = renderToolbar(inputs);

    expect(fixture.componentInstance.title()).toBe('TagCheck');
    expect(fixture.componentInstance.aboutDisabled()).toBe(true);
    expect(fixture.componentInstance.objectivesDisabled()).toBe(false);
    expect(getMenuHrefs(fixture)).toEqual([
      '/ja/app',
      'https://tag-check-documentation.vercel.app/ja/documentation/introduction',
      '/ja/objectives',
      'https://github.com/WodenWang820118/tag-check'
    ]);
  });

  it('hides both optional tabs when both visibility flags are true', () => {
    const inputs: ToolbarInputs = {
      title: 'TagCheck',
      primaryLink,
      docsLink,
      aboutDisabled: true,
      objectivesDisabled: true
    };
    const fixture = renderToolbar(inputs);

    expect(getMenuHrefs(fixture)).toEqual([
      '/ja/app',
      'https://tag-check-documentation.vercel.app/ja/documentation/introduction',
      'https://github.com/WodenWang820118/tag-check'
    ]);
  });
});

function renderToolbar(
  inputs: ToolbarInputs
): ComponentFixture<ToolBarComponent> {
  const fixture = TestBed.createComponent(ToolBarComponent);

  fixture.componentRef.setInput('title', inputs.title);
  fixture.componentRef.setInput('primaryLink', inputs.primaryLink);
  if ('docsLink' in inputs) {
    fixture.componentRef.setInput('docsLink', inputs.docsLink);
  }
  if ('aboutDisabled' in inputs) {
    fixture.componentRef.setInput('aboutDisabled', inputs.aboutDisabled);
  }
  if ('objectivesDisabled' in inputs) {
    fixture.componentRef.setInput(
      'objectivesDisabled',
      inputs.objectivesDisabled
    );
  }
  fixture.detectChanges();

  return fixture;
}

function getMenuLinks(
  fixture: ComponentFixture<ToolBarComponent>,
  expectedLength?: number
): HTMLAnchorElement[] {
  const links = Array.from(
    fixture.nativeElement.querySelectorAll('lib-menu-tabs a')
  ) as HTMLAnchorElement[];

  if (expectedLength !== undefined) {
    expect(links).toHaveLength(expectedLength);
  }

  return links;
}

function getMenuHrefs(fixture: ComponentFixture<ToolBarComponent>): string[] {
  return getMenuLinks(fixture).map((link) => link.getAttribute('href') ?? '');
}

function getHomeLink(
  fixture: ComponentFixture<ToolBarComponent>
): HTMLAnchorElement {
  const link = fixture.nativeElement.querySelector(
    'mat-toolbar > span a'
  ) as HTMLAnchorElement | null;

  expect(link).toBeTruthy();

  return link as HTMLAnchorElement;
}
