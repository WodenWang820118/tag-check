import { describe, it, expect, vi } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { ClickHandler } from './click-handler.service';
import { TestEventRepositoryService } from '../../../../core/repository/test-event/test-event-repository.service';
import { FileService } from '../../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../../infrastructure/os/path/file-path/file-path.service';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import type { Step } from '@utils';
import { StepElementNotFoundError } from '../step-failure/step-element-not-found.error';

function build(opts?: {
  stopNavigation?: boolean;
  clickResult?: boolean;
  clickThrows?: Error;
  selectorType?: string | undefined;
}) {
  const testEventRepositoryService = {
    getEntityBySlugAndEventId: vi.fn(async () => ({
      stopNavigation: opts?.stopNavigation
    }))
  } as unknown as TestEventRepositoryService;
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
      opts && 'selectorType' in opts ? opts.selectorType : 'css'
    )
  } as unknown as ActionUtilsService;
  return {
    handler: new ClickHandler(
      testEventRepositoryService,
      fileService,
      filePathService,
      clickStrategyService,
      actionUtilsService
    ),
    fileService,
    testEventRepositoryService,
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
    evaluate: vi.fn().mockResolvedValue(undefined),
    mouse: { click: vi.fn() },
    browserContext: () => ({ pages: vi.fn().mockResolvedValue([{}]) }),
    url: () => 'https://other.test/'
  };
}

describe('ClickHandler', () => {
  it('returns successfully when a selector strategy click succeeds', async () => {
    const { handler, clickStrategyService } = build();
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage() as never, 'p', 'e', step, false)
    ).resolves.toBeUndefined();
    expect(clickStrategyService.clickElement).toHaveBeenCalled();
  });

  it('throws when no selector works', async () => {
    const { handler } = build({ clickResult: false });
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage() as never, 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rethrows when the strategy throws (and ultimately fails)', async () => {
    const { handler } = build({ clickThrows: new Error('boom') });
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage() as never, 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws when getSelectorType returns falsy', async () => {
    const { handler } = build({ selectorType: undefined });
    const step: Step = { selectors: [['#a']], target: 'main' } as never;
    await expect(
      handler.handle(makePage() as never, 'p', 'e', step, false)
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
      dispose: vi.fn().mockResolvedValue(undefined),
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
    await expect(
      handler.handle(page as never, 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(StepElementNotFoundError);
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

    await handler.handle(makePage() as never, 'p', 'e', step, false);

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
      handler.handle(makePage() as never, 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it.each([true, false, undefined])(
    'uses the stored final-click bookmark (%s)',
    async (stopNavigation) => {
      const { handler, testEventRepositoryService } = build({ stopNavigation });
      const evaluate = vi.fn().mockResolvedValue(undefined);
      const page = { ...makePage(), evaluate };
      await handler.handle(
        page as never,
        'project',
        'event',
        { type: 'click', selectors: [['#a']] },
        true
      );
      expect(
        testEventRepositoryService.getEntityBySlugAndEventId
      ).toHaveBeenCalledWith('project', 'event');
      expect(evaluate).toHaveBeenCalledTimes(stopNavigation === true ? 2 : 0);
      for (const [source] of evaluate.mock.calls)
        expect(typeof source).toBe('string');
    }
  );

  it('does not block earlier journey clicks for a bookmarked test', async () => {
    const { handler, testEventRepositoryService } = build({
      stopNavigation: true
    });
    await handler.handle(
      makePage() as never,
      'p',
      'e',
      { type: 'click', selectors: [['#a']] },
      false
    );
    expect(
      testEventRepositoryService.getEntityBySlugAndEventId
    ).not.toHaveBeenCalled();
  });

  it('cleans the guard when the final click fails', async () => {
    const { handler } = build({
      stopNavigation: true,
      clickThrows: new Error('click failed')
    });
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = { ...makePage(), evaluate };
    await expect(
      handler.handle(
        page as never,
        'p',
        'e',
        { type: 'click', selectors: [['#a']] },
        true
      )
    ).rejects.toThrow('Failed to click');
    expect(evaluate).toHaveBeenCalledTimes(2);
    expect(evaluate.mock.calls[1][0]).toContain('typeof window[key]');
  });
});
