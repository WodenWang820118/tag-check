import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { firstValueFrom, of, throwError } from 'rxjs';
import { treeNodeResolver } from './documentation.resolver';

describe('treeNodeResolver', () => {
  let markdown: { getSource: ReturnType<typeof vi.fn> };

  function callResolver(name: string) {
    return TestBed.runInInjectionContext(() =>
      (treeNodeResolver as any)({ params: { name } } as never, {} as never)
    );
  }

  beforeEach(() => {
    markdown = { getSource: vi.fn() };
  });

  it('resolves to the requested file when content is present', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MarkdownService, useValue: markdown },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LOCALE_ID, useValue: 'en-US' }
      ]
    });
    markdown.getSource.mockReturnValueOnce(of('# hi'));
    const out: any = await firstValueFrom(callResolver('topic'));
    expect(out).toEqual({
      fileName: 'assets/markdown/en/topic.md',
      content: '# hi'
    });
  });

  it('falls back to a 404 message when content is empty', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MarkdownService, useValue: markdown },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LOCALE_ID, useValue: 'en-US' }
      ]
    });
    markdown.getSource.mockReturnValueOnce(of(''));
    const out: any = await firstValueFrom(callResolver('gone'));
    expect(out.fileName).toBe('404.md');
    expect(out.content).toContain('404');
  });

  it('falls back to the inline 404 message when browser load errors', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MarkdownService, useValue: markdown },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LOCALE_ID, useValue: 'en-US' }
      ]
    });
    markdown.getSource.mockReturnValueOnce(throwError(() => new Error('nope')));
    const errSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const out: any = await firstValueFrom(callResolver('x'));
    expect(out.fileName).toBe('404.md');
    expect(out.content).toContain('404 Not Found');
    errSpy.mockRestore();
  });

  it('reads markdown directly from the workspace during server rendering', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MarkdownService, useValue: markdown },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: LOCALE_ID, useValue: 'en-US' }
      ]
    });

    const out: any = await firstValueFrom(callResolver('introduction'));
    expect(markdown.getSource).not.toHaveBeenCalled();
    expect(out.fileName).toBe('assets/markdown/en/introduction.md');
    expect(out.content).toContain('# Introduction');
  });

  it('falls back to the inline 404 message when server file read errors', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MarkdownService, useValue: markdown },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: LOCALE_ID, useValue: 'en-US' }
      ]
    });

    const errSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const out: any = await firstValueFrom(callResolver('missing-doc-page'));
    expect(markdown.getSource).not.toHaveBeenCalled();
    expect(out.fileName).toBe('404.md');
    expect(out.content).toContain('404 Not Found');
    errSpy.mockRestore();
  });

  it('falls back to english assets when the localized browser markdown file is unavailable', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MarkdownService, useValue: markdown },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LOCALE_ID, useValue: 'zh-Hant' }
      ]
    });
    markdown.getSource
      .mockReturnValueOnce(
        throwError(() => new Error('missing localized file'))
      )
      .mockReturnValueOnce(of('# english fallback'));

    const out: any = await firstValueFrom(callResolver('topic'));

    expect(markdown.getSource).toHaveBeenNthCalledWith(
      1,
      'assets/markdown/zh-hant/topic.md'
    );
    expect(markdown.getSource).toHaveBeenNthCalledWith(
      2,
      'assets/markdown/en/topic.md'
    );
    expect(out).toEqual({
      fileName: 'assets/markdown/en/topic.md',
      content: '# english fallback'
    });
  });
});
