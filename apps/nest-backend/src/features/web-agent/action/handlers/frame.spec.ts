import { describe, expect, it, vi } from 'vitest';
import { resolveStepFrame, targetFrame } from './frame';

describe('targetFrame', () => {
  it('queries through the page main frame', () => {
    const main = { childFrames: () => [] };
    const page = { mainFrame: () => main };
    expect(targetFrame(page as never)).toBe(main);
  });

  it('keeps a frame that is already the document to query', () => {
    const frame = { childFrames: () => [] };
    expect(targetFrame(frame as never)).toBe(frame);
  });
});

describe('resolveStepFrame', () => {
  it('uses the main frame when the recording has no frame path', async () => {
    const main = { childFrames: vi.fn(() => []) };
    const page = { mainFrame: () => main };

    await expect(resolveStepFrame(page as never, undefined, 10)).resolves.toBe(
      main
    );
    await expect(resolveStepFrame(page as never, [], 10)).resolves.toBe(main);
    expect(main.childFrames).not.toHaveBeenCalled();
  });

  it('walks child frames by the recorded indexes', async () => {
    const grandchild = { childFrames: () => [] };
    const second = { childFrames: () => [grandchild] };
    const first = { childFrames: () => [] };
    const page = {
      mainFrame: () => ({ childFrames: () => [first, second] })
    };

    await expect(resolveStepFrame(page as never, [1, 0], 20)).resolves.toBe(
      grandchild
    );
  });

  it('waits for a child frame that appears within the timeout', async () => {
    let calls = 0;
    const late = { childFrames: () => [] };
    const page = {
      mainFrame: () => ({
        childFrames: () => {
          calls += 1;
          return calls >= 3 ? [late] : [];
        }
      })
    };

    await expect(resolveStepFrame(page as never, [0], 500)).resolves.toBe(late);
    expect(calls).toBeGreaterThan(1);
  });

  it('throws naming the frame path when an index never appears', async () => {
    const page = { mainFrame: () => ({ childFrames: () => [] }) };

    await expect(resolveStepFrame(page as never, [2], 40)).rejects.toThrow(
      'Frame [2] did not appear within 40 ms (no child frame at index 2 of the main frame)'
    );
  });

  it('names the parent frame when a nested index is missing', async () => {
    const page = {
      mainFrame: () => ({
        childFrames: () => [{ childFrames: () => [] }]
      })
    };

    await expect(resolveStepFrame(page as never, [0, 1], 40)).rejects.toThrow(
      'Frame [0, 1] did not appear within 40 ms (no child frame at index 1 of frame [0])'
    );
  });
});
