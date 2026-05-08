import { TestBed } from '@angular/core/testing';
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
    TestBed.configureTestingModule({
      providers: [{ provide: MarkdownService, useValue: markdown }]
    });
  });

  it('resolves to the requested file when content is present', async () => {
    markdown.getSource.mockReturnValueOnce(of('# hi'));
    const out: any = await firstValueFrom(callResolver('topic'));
    expect(out).toEqual({
      fileName: 'assets/markdown/topic.md',
      content: '# hi'
    });
  });

  it('falls back to a 404 message when content is empty', async () => {
    markdown.getSource.mockReturnValueOnce(of(''));
    const out: any = await firstValueFrom(callResolver('gone'));
    expect(out.fileName).toBe('404.md');
    expect(out.content).toContain('404');
  });

  it('falls back to assets/404.md when load errors', async () => {
    markdown.getSource
      .mockReturnValueOnce(throwError(() => new Error('nope')))
      .mockReturnValueOnce(of('# 404'));
    const errSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const out: any = await firstValueFrom(callResolver('x'));
    expect(out.content).toBe('# 404');
    errSpy.mockRestore();
  });
});
