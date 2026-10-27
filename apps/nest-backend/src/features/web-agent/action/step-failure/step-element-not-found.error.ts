import { HttpException, HttpStatus } from '@nestjs/common';
import type { StepFailureContext } from '@utils';

/**
 * A step gave up because none of its selectors matched an element in time.
 * ActionService adds the step's index and what the page showed then
 * (`context`), and the run saves both, so a later look at the run can say
 * which step failed and suggest a replacement.
 */
export class StepElementNotFoundError extends HttpException {
  /** 0-based; set by ActionService. */
  stepIndex: number | null = null;
  /** What the page showed when the step gave up; set by ActionService. */
  context: StepFailureContext | null = null;

  constructor(
    message: string,
    /** The selectors the step waited for. */
    readonly selectors: readonly string[],
    /** How long it waited, in milliseconds. */
    readonly timeoutMs: number,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(message, status);
    this.name = 'StepElementNotFoundError';
  }
}
