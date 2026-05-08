import { describe, expect, it, vi } from 'vitest';
import { main } from './runtime-main.ts';

describe('runtime-main main()', () => {
  it('invokes the four dependencies in the documented order', () => {
    const calls: string[] = [];
    const buildBackendApplicationFn = vi.fn(() => {
      calls.push('build');
    });
    const stopExistingDesktopSidecarsFn = vi.fn(() => {
      calls.push('stop');
    });
    const prepareNodeSidecarFn = vi.fn(() => {
      calls.push('node');
    });
    const prepareBackendRuntimeFn = vi.fn(() => {
      calls.push('backend');
    });

    main({
      buildBackendApplicationFn,
      stopExistingDesktopSidecarsFn,
      prepareNodeSidecarFn,
      prepareBackendRuntimeFn
    });

    expect(calls).toEqual(['build', 'stop', 'node', 'backend']);
    expect(buildBackendApplicationFn).toHaveBeenCalledTimes(1);
    expect(stopExistingDesktopSidecarsFn).toHaveBeenCalledTimes(1);
    expect(prepareNodeSidecarFn).toHaveBeenCalledTimes(1);
    expect(prepareBackendRuntimeFn).toHaveBeenCalledTimes(1);
  });

  it('propagates failures from earlier steps without invoking later ones', () => {
    const stopExistingDesktopSidecarsFn = vi.fn();
    const prepareNodeSidecarFn = vi.fn();
    const prepareBackendRuntimeFn = vi.fn();
    const buildBackendApplicationFn = vi.fn(() => {
      throw new Error('build failed');
    });

    expect(() =>
      main({
        buildBackendApplicationFn,
        stopExistingDesktopSidecarsFn,
        prepareNodeSidecarFn,
        prepareBackendRuntimeFn
      })
    ).toThrow('build failed');
    expect(stopExistingDesktopSidecarsFn).not.toHaveBeenCalled();
    expect(prepareNodeSidecarFn).not.toHaveBeenCalled();
    expect(prepareBackendRuntimeFn).not.toHaveBeenCalled();
  });
});
