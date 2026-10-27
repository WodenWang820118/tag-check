import { describe, expect, it, vi } from 'vitest';
import type { Step } from '@utils';
import {
  CANDIDATES_KEPT,
  StepFailureCollectorService
} from './step-failure-collector.service';

const facts = {
  url: 'https://example.test/product',
  title: 'Blue hoodie',
  viewport: { width: 1280, height: 800 },
  candidatesFound: 1,
  candidates: [
    {
      index: 0,
      tag: 'button',
      role: 'button',
      name: 'Add to bag',
      attributes: { 'data-testid': 'add-to-bag' },
      box: { x: 10, y: 20, width: 100, height: 40 },
      selectors: ['[data-testid="add-to-bag"]']
    }
  ]
};

function pageWith(counts: Record<string, number | Error>) {
  const dispose = vi.fn().mockResolvedValue(undefined);
  return {
    dispose,
    page: {
      evaluate: vi.fn().mockResolvedValue(facts),
      $$: vi.fn(async (selector: string) => {
        const count = counts[selector];
        if (count instanceof Error) throw count;
        return Array.from({ length: count ?? 0 }, () => ({ dispose }));
      })
    }
  };
}

const step: Step = {
  type: 'click',
  selectors: [['aria/Add to cart'], ['#add', '#ignored'], 'xpath//main/button'],
  offsetX: 12,
  offsetY: 8
};

describe('StepFailureCollectorService', () => {
  const collector = new StepFailureCollectorService();

  it("records the page, the candidates and what each of the step's selectors matched", async () => {
    const { page, dispose } = pageWith({
      'aria/Add to cart': 0,
      '#add': 2,
      'xpath//main/button': new Error('bad selector')
    });

    const context = await collector.collect(
      page as never,
      step,
      3,
      15000,
      new Date('2026-10-27T10:00:00.000Z')
    );

    expect(context).toEqual({
      stepIndex: 3,
      stepType: 'click',
      selectors: [
        { selector: 'aria/Add to cart', matches: 0 },
        { selector: '#add', matches: 2 },
        { selector: 'xpath//main/button', matches: null }
      ],
      timeoutMs: 15000,
      offset: { x: 12, y: 8 },
      ...facts,
      capturedAt: '2026-10-27T10:00:00.000Z'
    });
    expect(page.evaluate).toHaveBeenCalledWith(
      expect.stringContaining(`const LIMIT = ${CANDIDATES_KEPT};`)
    );
    expect(dispose).toHaveBeenCalledTimes(2);
  });

  it('records no offset for a step without one', async () => {
    const { page } = pageWith({});

    const context = await collector.collect(
      page as never,
      { type: 'change', selectors: [] },
      0,
      5000
    );

    expect(context).toMatchObject({ offset: null, selectors: [] });
  });

  it('gives null when the page cannot be read', async () => {
    const page = {
      evaluate: vi.fn().mockRejectedValue(new Error('Target closed'))
    };

    await expect(
      collector.collect(page as never, step, 1, 15000)
    ).resolves.toBeNull();
  });
});
