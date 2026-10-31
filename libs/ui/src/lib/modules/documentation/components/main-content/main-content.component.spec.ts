import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { provideMarkdown } from 'ngx-markdown';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MainContentComponent } from './main-content.component';

describe('MainContentComponent', () => {
  let fixture: ComponentFixture<MainContentComponent>;
  let component: MainContentComponent;
  let routeData$: BehaviorSubject<{
    data?: { content?: string; fileName?: string };
  }>;

  beforeEach(async () => {
    routeData$ = new BehaviorSubject<{
      data?: { content?: string; fileName?: string };
    }>({
      data: { content: '# Start Content', fileName: 'start.md' }
    });

    await TestBed.configureTestingModule({
      imports: [MainContentComponent],
      providers: [
        provideMarkdown(),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData$
          }
        },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives content from route data', () => {
    expect(component.content()).toBe('# Start Content');
    expect(component.toc()).toEqual([
      { id: 'start-content', text: 'Start Content' }
    ]);
  });

  it('updates content and resets toc when route data emits new content', () => {
    document.body.innerHTML = `
      <div id="markdown">
        <h1>Heading 1</h1>
      </div>
    `;
    component.onMarkdownReady();
    expect(component.toc()).toEqual([{ id: 'heading-1', text: 'Heading 1' }]);

    routeData$.next({
      data: { content: '# Next Content', fileName: 'next.md' }
    });
    TestBed.tick();

    expect(component.content()).toBe('# Next Content');
    expect(component.toc()).toEqual([]);

    document.body.innerHTML = '';
  });

  it('handles empty or missing route data gracefully', () => {
    routeData$.next({});
    TestBed.tick();
    expect(component.content()).toBe('');
    expect(component.toc()).toEqual([]);
  });

  it('generates heading IDs and populates toc onMarkdownReady', () => {
    document.body.innerHTML = `
      <div id="markdown">
        <h1>Overview</h1>
        <h2>Details</h2>
      </div>
    `;

    component.onMarkdownReady();

    expect(component.toc()).toEqual([
      { id: 'overview', text: 'Overview' },
      { id: 'details', text: 'Details' }
    ]);

    const h1 = document.querySelector('#markdown h1');
    const h2 = document.querySelector('#markdown h2');
    expect(h1?.id).toBe('overview');
    expect(h2?.id).toBe('details');

    document.body.innerHTML = '';
  });

  it('scrolls to section when scrollToSection is called in browser', () => {
    const el = document.createElement('div');
    el.id = 'section-1';
    const scrollSpy = vi.fn();
    el.scrollIntoView = scrollSpy;
    document.body.appendChild(el);

    component.scrollToSection('section-1');

    expect(component.activeSection).toBe('section-1');
    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    });

    document.body.removeChild(el);
  });

  it('selects and scrolls to the markdown container when scrollToTop is called', () => {
    const spy = vi.spyOn(component, 'scrollToSection');
    const markdown = document.getElementById('markdown');
    if (!markdown) {
      throw new Error('Expected the rendered markdown container');
    }
    const scrollSpy = vi.fn();
    markdown.scrollIntoView = scrollSpy;
    component.activeSection = 'section-1';

    component.scrollToTop();

    expect(component.activeSection).toBe('markdown');
    expect(spy).toHaveBeenCalledWith('markdown');
    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    });
  });
});

describe('MainContentComponent on server platform (SSR)', () => {
  it('does not perform browser-specific DOM actions on server', async () => {
    const routeData$ = new BehaviorSubject<{
      data?: { content?: string; fileName?: string };
    }>({
      data: { content: '# Server SSR Content', fileName: 'server.md' }
    });

    await TestBed.configureTestingModule({
      imports: [MainContentComponent],
      providers: [
        provideMarkdown(),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData$
          }
        },
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MainContentComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.content()).toBe('# Server SSR Content');
    expect(component.toc()).toEqual([]);

    // onMarkdownReady and scrollToSection should exit early without touching document
    component.onMarkdownReady();
    expect(component.toc()).toEqual([]);

    component.scrollToSection('any-section');
    expect(component.activeSection).toBeNull();
  });
});
