import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LangSelectComponent } from './lang-select.component';

describe('LangSelectComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    Object.defineProperty(globalThis.navigator, 'language', {
      configurable: true,
      get: () => 'en-US'
    });
    await TestBed.configureTestingModule({
      imports: [LangSelectComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'en' },
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes selectedLang from the browser language', () => {
    const fixture = TestBed.createComponent(LangSelectComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLang).toBe('en');
    expect(fixture.componentInstance.selectedLangLabel).toBe('English');
  });

  it('detects Japanese browser locales', () => {
    Object.defineProperty(globalThis.navigator, 'language', {
      configurable: true,
      get: () => 'ja-JP'
    });
    const fixture = TestBed.createComponent(LangSelectComponent);
    expect(fixture.componentInstance.selectedLang).toBe('ja');
  });

  it('detects simplified and traditional Chinese browser locales', () => {
    Object.defineProperty(globalThis.navigator, 'language', {
      configurable: true,
      get: () => 'zh-hans-CN'
    });
    let fixture = TestBed.createComponent(LangSelectComponent);
    expect(fixture.componentInstance.selectedLang).toBe('zh-hans');

    Object.defineProperty(globalThis.navigator, 'language', {
      configurable: true,
      get: () => 'zh-hant-TW'
    });
    fixture = TestBed.createComponent(LangSelectComponent);
    expect(fixture.componentInstance.selectedLang).toBe('zh-hant');
  });

  it('persists the selected language in localStorage on changeLocale', () => {
    const fixture = TestBed.createComponent(LangSelectComponent);
    fixture.componentInstance.selectedLang = 'ja';
    fixture.componentInstance.changeLocale();

    expect(localStorage.getItem('locale')).toBe('ja');
    expect(fixture.componentInstance.selectedLangLabel).toBe('日本語');
  });

  it('returns a fallback English language object when selection is unknown', () => {
    const fixture = TestBed.createComponent(LangSelectComponent);
    // simulate an unknown locale
    fixture.componentInstance.selectedLang = 'xx' as never;
    expect(fixture.componentInstance.getSelectedLanguage()).toEqual({
      code: 'en',
      label: 'English'
    });
  });

  it('exposes a reloadPage method on the component contract', () => {
    const fixture = TestBed.createComponent(LangSelectComponent);
    expect(typeof fixture.componentInstance.reloadPage).toBe('function');
  });
});
