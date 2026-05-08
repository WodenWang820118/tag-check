import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'en' },
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('builds a localized SVG path from the active locale', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    expect(fixture.componentInstance.getLocalizedSvgPath()).toBe(
      'assets/i18n/en/tag_build_system_en.drawio.svg'
    );
  });

  it('uses the configured locale token', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'ja' }]
    });
    const fixture = TestBed.createComponent(AboutComponent);
    expect(fixture.componentInstance.getLocalizedSvgPath()).toBe(
      'assets/i18n/ja/tag_build_system_ja.drawio.svg'
    );
  });

  it('exposes example payloads with the expected shape', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    const cmp = fixture.componentInstance;
    expect(cmp.exampleInput.event).toBe('begin_checkout');
    expect(Array.isArray(cmp.exampleArrayInput)).toBe(true);
    expect(cmp.exampleArrayInput).toHaveLength(2);
  });
});
