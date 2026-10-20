import { describe, it, expect, vi } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { ClickHandler } from './click-handler.service';
import { ProjectService } from '../../../../infrastructure/os/project/project.service';
import { FileService } from '../../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../../infrastructure/os/path/file-path/file-path.service';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import type { Step } from '@utils';

function build(opts?: {
  clickResult?: boolean;
  clickThrows?: Error;
  selectorType?: string | undefined;
}) {
  const projectService = {} as ProjectService;
  const fileService = {
    readJsonFile: vi.fn(() => ({
      steps: [{ url: 'https://start' }, { url: 'https://example.com/page' }]
    }))
  } as unknown as FileService;
  const filePathService = {
    getOperationFilePath: vi.fn(async () => '/tmp/op.json')
  } as unknown as FilePathService;
  const clickStrategyService = {
    clickElement: vi.fn(async () => {
      if (opts?.clickThrows) throw opts.clickThrows;
      return opts?.clickResult ?? true;
    })
  } as unknown as ClickStrategyService;
  const actionUtilsService = {
    getSelectorType: vi.fn(() =>
      'selectorType' in (opts ?? {}) ? opts!.selectorType : 'css'
    )
  } as unknown as ActionUtilsService;
  return {
    handler: new ClickHandler(
      projectService,
      fileService,
      filePathService,
      clickStrategyService,
      actionUtilsService
    ),
    fileService,
    clickStrategyService,
    actionUtilsService
  };
}

/** Rejects like Puppeteer's waitForSelector when the selector never appears. */
const timedOut = (selector: string) =>
  Promise.reject(
    Object.assign(new Error(`Waiting for selector \`${selector}\` failed`), {
      name: 'TimeoutError'
    })
  );

function makePage() {
  return {
    waitForSelector: vi.fn().mockResolvedValue({ dispose: vi.fn() }),
    $: vi.fn(),
    mouse: { click: vi.fn() },
    browserContext: () => ({ pages: vi.fn().mockResolvedValue([{}]) }),
    url: () => 'https://other.test/'
  } as never;
}

describe('ClickHandler', () => {
  it('returns successfully when a selector strategy click succeeds', async () => {
    const { handler, clickStrategyService } = build();
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage(), 'p', 'e', step, false)
    ).resolves.toBeUndefined();
    expect(clickStrategyService.clickElement).toHaveBeenCalled();
  });

  it('throws when no selector works', async () => {
    const { handler } = build({ clickResult: false });
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage(), 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rethrows when the strategy throws (and ultimately fails)', async () => {
    const { handler } = build({ clickThrows: new Error('boom') });
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage(), 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws when getSelectorType returns falsy', async () => {
    const { handler } = build({ selectorType: undefined });
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage(), 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('scrolls the element into view, then clicks at the recorded offset', async () => {
    const { handler } = build();
    const page = makePage() as unknown as {
      $: ReturnType<typeof vi.fn>;
      mouse: { click: ReturnType<typeof vi.fn> };
    };
    const calls: string[] = [];
    const scrollIntoView = vi.fn(async () => {
      calls.push('scroll');
    });
    page.$ = vi.fn().mockResolvedValue({
      scrollIntoView,
      boundingBox: async () => {
        calls.push('measure');
        return { x: 10, y: 20, width: 1, height: 1 };
      }
    });
    const step: Step = {
      selectors: [['#a']],
      target: 'main',
      offsetX: 5,
      offsetY: 7
    } as never;
    await handler.handle(page as never, 'p', 'e', step, false);
    expect(calls).toEqual(['scroll', 'measure']);
    expect(page.mouse.click).toHaveBeenCalledWith(15, 27, { delay: 100 });
  });

  it('clicks the selector that became visible first', async () => {
    const { handler, clickStrategyService } = build();
    const page = makePage() as unknown as {
      waitForSelector: ReturnType<typeof vi.fn>;
    };
    page.waitForSelector = vi.fn((selector: string) =>
      selector === '#later-in-list'
        ? Promise.resolve({ dispose: vi.fn() })
        : timedOut(selector)
    );
    const step: Step = {
      selectors: [['#missing'], ['#later-in-list']],
      target: 'main'
    } as never;

    await handler.handle(page as never, 'p', 'e', step, false);

    expect(
      (clickStrategyService.clickElement as ReturnType<typeof vi.fn>).mock
        .calls[0][3]
    ).toBe('#later-in-list');
  });

  it('fails after the shared wait when no selector becomes visible', async () => {
    const { handler, clickStrategyService } = build();
    const page = makePage() as unknown as {
      waitForSelector: ReturnType<typeof vi.fn>;
    };
    page.waitForSelector = vi.fn((selector: string) => timedOut(selector));
    const step: Step = {
      selectors: [['#a'], ['#b']],
      target: 'main',
      timeout: 50
    } as never;

    await expect(
      handler.handle(page as never, 'p', 'e', step, false)
    ).rejects.toThrow(/None of the selectors became visible within 50 ms/);
    expect(clickStrategyService.clickElement).not.toHaveBeenCalled();
  });

  it('reports a broken wait as itself, not as an invisible element', async () => {
    const { handler, clickStrategyService } = build();
    const page = makePage() as unknown as {
      waitForSelector: ReturnType<typeof vi.fn>;
    };
    const detached = new Error('Attempted to use detached Frame');
    page.waitForSelector = vi.fn().mockRejectedValue(detached);
    const step: Step = { selectors: [['#a']], target: 'main' } as never;

    await expect(
      handler.handle(page as never, 'p', 'e', step, false)
    ).rejects.toBe(detached);
    expect(clickStrategyService.clickElement).not.toHaveBeenCalled();
  });

  it('gives the click itself the 5 s action budget', async () => {
    const { handler, clickStrategyService } = build();
    const step: Step = { selectors: [['#a']], target: 'main' } as never;

    await handler.handle(makePage(), 'p', 'e', step, false);

    expect(
      (clickStrategyService.clickElement as ReturnType<typeof vi.fn>).mock
        .calls[0][6]
    ).toBe(5000);
  });

  it('throws when readJsonFile yields no step url', async () => {
    const { handler, fileService } = build();
    (fileService.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
      steps: [{ url: 'https://start' }]
    });
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage(), 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
