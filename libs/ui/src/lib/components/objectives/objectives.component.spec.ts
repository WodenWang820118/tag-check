import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ObjectivesComponent } from './objectives.component';

describe('ObjectivesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectivesComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'zh-hant' }]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(ObjectivesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('returns a localized SVG path that includes the active locale', () => {
    const fixture = TestBed.createComponent(ObjectivesComponent);
    expect(fixture.componentInstance.getLocalizedSvgPath()).toBe(
      '/assets/i18n/zh-hant/tag_check_system_zh-hant.drawio.svg'
    );
  });
});
