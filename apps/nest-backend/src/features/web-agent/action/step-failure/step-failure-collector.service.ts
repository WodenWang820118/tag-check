import { Injectable, Logger } from '@nestjs/common';
import type { Page } from 'puppeteer';
import type { ElementCandidate, Step, StepFailureContext } from '@utils';
import { getFirstSelector } from '../handlers/utils';
import { withTimeout } from '../strategies/with-timeout';
import { collectCandidatesSource } from './collect-candidates.script';

/** The most candidates kept from one page. */
export const CANDIDATES_KEPT = 300;

/** How long collecting may take before the run goes on without it. */
export const COLLECT_TIMEOUT_MS = 5_000;

type PageFacts = Pick<
  StepFailureContext,
  'url' | 'title' | 'viewport' | 'candidatesFound'
> & { candidates: ElementCandidate[] };

/**
 * Records what the page showed when a step could not find its element: how
 * many elements each of the step's selectors matched, and the visible
 * elements a person can act on, with selectors that match only them.
 */
@Injectable()
export class StepFailureCollectorService {
  private readonly logger = new Logger(StepFailureCollectorService.name);

  /**
   * The failure's context, or null when the page could not be read (it
   * closed or did not answer in COLLECT_TIMEOUT_MS). Never throws: the run
   * fails with the step's own error either way.
   */
  async collect(
    page: Page,
    step: Step,
    stepIndex: number,
    timeoutMs: number,
    now: Date = new Date()
  ): Promise<StepFailureContext | null> {
    try {
      return await withTimeout(
        this.read(page, step, stepIndex, timeoutMs, now),
        COLLECT_TIMEOUT_MS,
        'Reading the page took too long'
      );
    } catch (error) {
      this.logger.warn(
        `Could not record what step ${stepIndex + 1} saw: ${String(error)}`
      );
      return null;
    }
  }

  private async read(
    page: Page,
    step: Step,
    stepIndex: number,
    timeoutMs: number,
    now: Date
  ): Promise<StepFailureContext> {
    const facts = (await page.evaluate(
      collectCandidatesSource(CANDIDATES_KEPT)
    )) as PageFacts;
    const selectors = [];
    for (const selector of (step.selectors ?? []).map(getFirstSelector)) {
      selectors.push({ selector, matches: await this.count(page, selector) });
    }
    return {
      stepIndex,
      stepType: step.type,
      selectors,
      timeoutMs,
      offset:
        typeof step.offsetX === 'number' && typeof step.offsetY === 'number'
          ? { x: step.offsetX, y: step.offsetY }
          : null,
      url: facts.url,
      title: facts.title,
      viewport: facts.viewport,
      candidates: facts.candidates,
      candidatesFound: facts.candidatesFound,
      capturedAt: now.toISOString()
    };
  }

  /**
   * How many elements `selector` matches now, in Puppeteer's syntax (CSS,
   * or aria/, xpath/, pierce/, text/); null when it cannot be run.
   */
  private async count(page: Page, selector: string): Promise<number | null> {
    try {
      const handles = await page.$$(selector);
      await Promise.all(handles.map((handle) => handle.dispose()));
      return handles.length;
    } catch {
      return null;
    }
  }
}
