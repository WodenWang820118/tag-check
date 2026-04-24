import '@angular/localize/init';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolBarComponent, type ToolbarInputs } from '../../../index';

describe('ToolbarInputs', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolBarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('supports the minimal toolbar contract', () => {
    const inputs: ToolbarInputs = { title: 'Tag Build' };
    const fixture = renderToolbar(inputs);
    const [aboutLink, objectivesLink] = getMenuLinks(fixture);

    expect(fixture.componentInstance.title()).toBe('Tag Build');
    expect(fixture.componentInstance.aboutDisabled()).toBe(false);
    expect(fixture.componentInstance.objectivesDisabled()).toBe(false);
    expect(aboutLink.classList.contains('hidden')).toBe(false);
    expect(objectivesLink.classList.contains('hidden')).toBe(false);
  });

  it('supports optional toolbar visibility flags', () => {
    const inputs: ToolbarInputs = {
      title: 'TagCheck',
      aboutDisabled: true,
      objectivesDisabled: false
    };
    const fixture = renderToolbar(inputs);
    const [aboutLink, objectivesLink] = getMenuLinks(fixture);

    expect(fixture.componentInstance.title()).toBe('TagCheck');
    expect(fixture.componentInstance.aboutDisabled()).toBe(true);
    expect(fixture.componentInstance.objectivesDisabled()).toBe(false);
    expect(aboutLink.classList.contains('hidden')).toBe(true);
    expect(objectivesLink.classList.contains('hidden')).toBe(false);
  });

  it('hides both optional tabs when both visibility flags are true', () => {
    const inputs: ToolbarInputs = {
      title: 'TagCheck',
      aboutDisabled: true,
      objectivesDisabled: true
    };
    const fixture = renderToolbar(inputs);
    const [aboutLink, objectivesLink] = getMenuLinks(fixture);

    expect(aboutLink.classList.contains('hidden')).toBe(true);
    expect(objectivesLink.classList.contains('hidden')).toBe(true);
  });
});

function renderToolbar(
  inputs: ToolbarInputs
): ComponentFixture<ToolBarComponent> {
  const fixture = TestBed.createComponent(ToolBarComponent);

  fixture.componentRef.setInput('title', inputs.title);
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
  fixture: ComponentFixture<ToolBarComponent>
): HTMLAnchorElement[] {
  const links = Array.from(
    fixture.nativeElement.querySelectorAll('lib-menu-tabs a')
  ) as HTMLAnchorElement[];

  expect(links).toHaveLength(3);

  return links;
}
