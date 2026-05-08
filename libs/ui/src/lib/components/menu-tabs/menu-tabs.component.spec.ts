import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MenuTabsComponent } from './menu-tabs.component';

describe('MenuTabsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuTabsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('creates the component with three nav links', () => {
    const fixture = TestBed.createComponent(MenuTabsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.links).toHaveLength(3);
    expect(fixture.componentInstance.links.map((l) => l.link)).toEqual([
      '/about',
      '/objectives',
      '/github'
    ]);
  });

  it('aboutDisabled defaults to true and objectivesDisabled defaults to undefined', () => {
    const fixture = TestBed.createComponent(MenuTabsComponent);
    expect(fixture.componentInstance.aboutDisabled()).toBe(true);
    expect(fixture.componentInstance.objectivesDisabled()).toBeUndefined();
  });

  it('returns translated names from the localization helper', () => {
    const fixture = TestBed.createComponent(MenuTabsComponent);
    expect(fixture.componentInstance.getTranslatedName('about')).toBe('About');
    expect(fixture.componentInstance.getTranslatedName('objectives')).toBe(
      'Objectives'
    );
    expect(fixture.componentInstance.getTranslatedName('github')).toBe(
      'GitHub'
    );
  });
});
