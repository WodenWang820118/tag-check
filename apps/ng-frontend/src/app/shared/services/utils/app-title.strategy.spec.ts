import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { AppTitleStrategy } from './app-title.strategy';

describe('AppTitleStrategy', () => {
  let strategy: AppTitleStrategy;
  let title: Title;

  beforeEach(() => {
    strategy = TestBed.inject(AppTitleStrategy);
    title = TestBed.inject(Title);
  });

  it('puts the page title before the app name', () => {
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Reports');
    strategy.updateTitle({} as RouterStateSnapshot);
    expect(title.getTitle()).toBe('Reports · Tag Check');
  });

  it('uses the app name alone on pages without a title', () => {
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    strategy.updateTitle({} as RouterStateSnapshot);
    expect(title.getTitle()).toBe('Tag Check');
  });
});
