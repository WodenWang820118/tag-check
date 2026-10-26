import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MarkdownService } from 'ngx-markdown';
import { describe, expect, it } from 'vitest';
import { DOCUMENTATION_ROUTES } from './documentation.routes';

describe('DOCUMENTATION_ROUTES', () => {
  const [route] = DOCUMENTATION_ROUTES;

  it('provides the Markdown renderer to the documentation pages only', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), ...(route.providers ?? [])]
    });

    expect(TestBed.inject(MarkdownService)).toBeInstanceOf(MarkdownService);
  });

  it('lazy-loads the documentation pages', async () => {
    const children = await route.loadChildren?.();

    expect(Array.isArray(children)).toBe(true);
    expect(children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ data: { seoKey: 'documentation' } })
      ])
    );
  });
});
