import { describe, expect, it } from 'vitest';
import { NO_RESULT_MESSAGE, toItemOutcome } from './batch-run.mapper';

describe('toItemOutcome', () => {
  it('passes when both checks passed', () => {
    expect(
      toItemOutcome({
        id: 7,
        passed: true,
        requestPassed: true,
        requestChecked: true
      })
    ).toEqual({ status: 'passed', message: null, testEventDetailId: 7 });
  });

  it('is partial when one check passed', () => {
    expect(
      toItemOutcome({
        id: 7,
        passed: true,
        requestPassed: false,
        requestChecked: true
      }).status
    ).toBe('partial');
    expect(
      toItemOutcome({
        id: 7,
        passed: false,
        requestPassed: true,
        requestChecked: true
      }).status
    ).toBe('partial');
  });

  it('fails when neither check passed', () => {
    expect(
      toItemOutcome({
        id: 7,
        passed: false,
        requestPassed: false,
        requestChecked: true
      })
    ).toEqual({ status: 'failed', message: null, testEventDetailId: 7 });
  });

  it('passes on the data layer check alone when the run made no request check', () => {
    expect(
      toItemOutcome({
        id: 7,
        passed: true,
        requestPassed: false,
        requestChecked: false
      }).status
    ).toBe('passed');
  });

  it('is an error, with the client message, when the run threw', () => {
    expect(
      toItemOutcome(null, {
        error: new Error('Chromium failed at /home/me/chrome\nstack line')
      })
    ).toEqual({
      status: 'error',
      message: 'Chromium failed at <path>',
      testEventDetailId: null
    });
  });

  it('keeps the result a failed run saved', () => {
    expect(
      toItemOutcome(
        { id: 3, passed: false, requestPassed: false, requestChecked: true },
        { error: undefined }
      )
    ).toEqual({
      status: 'error',
      message: 'The run failed',
      testEventDetailId: 3
    });
  });

  it('is an error when the run saved nothing', () => {
    expect(toItemOutcome(null)).toEqual({
      status: 'error',
      message: NO_RESULT_MESSAGE,
      testEventDetailId: null
    });
  });
});
