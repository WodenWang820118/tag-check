import { EventEmitter } from 'events';
import { PassThrough, Writable } from 'stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  RECORDING_FPS,
  RunRecorder,
  frameRepeats,
  recordingArgs
} from './run-recorder';

/** Stands in for ffmpeg: records stdin writes and exits when stdin ends. */
class FakeFfmpeg extends EventEmitter {
  readonly frames: string[] = [];
  readonly stderr = new PassThrough();
  readonly kill = vi.fn(() => {
    this.emit('close', null, 'SIGKILL');
    return true;
  });
  exitOnEnd = true;
  failWrites: Error | null = null;
  readonly stdin = new Writable({
    write: (chunk: Buffer, _encoding, callback) => {
      if (this.failWrites) {
        callback(this.failWrites);
        return;
      }
      this.frames.push(chunk.toString());
      callback();
    },
    final: (callback) => {
      callback();
      if (this.exitOnEnd) setImmediate(() => this.emit('close', 0, null));
    }
  });
}

class FakeSession extends EventEmitter {
  readonly send = vi.fn(
    async (_method: string, _params?: unknown) => undefined
  );
  readonly detach = vi.fn(async () => undefined);

  frame(data: string, timestamp: number) {
    this.emit('Page.screencastFrame', {
      data: Buffer.from(data).toString('base64'),
      metadata: { timestamp },
      sessionId: 1
    });
  }
}

function setup(viewport = { width: 1401, height: 900 }) {
  const ffmpeg = new FakeFfmpeg();
  const session = new FakeSession();
  const spawnProcess = vi.fn(() => ffmpeg as never);
  const page = {
    viewport: () => viewport,
    createCDPSession: vi.fn(async () => session)
  };
  const start = () =>
    RunRecorder.start(
      page as never,
      'C:/out/recording.webm',
      'ffmpeg.exe',
      spawnProcess
    );
  return { ffmpeg, session, spawnProcess, start };
}

/** Lets queued frame writes and stream callbacks run. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('RunRecorder', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts ffmpeg at an even size and a JPEG screencast of the same size', async () => {
    const { session, spawnProcess, start } = setup();

    await start();

    expect(spawnProcess).toHaveBeenCalledWith(
      'ffmpeg.exe',
      recordingArgs(1402, 900, 'C:/out/recording.webm')
    );
    expect(session.send).toHaveBeenCalledWith('Page.startScreencast', {
      format: 'jpeg',
      quality: 80,
      maxWidth: 1402,
      maxHeight: 900
    });
  });

  it('writes each frame for as long as it was on screen, and the last one up to stop', async () => {
    const { ffmpeg, session, start } = setup();
    const recorder = await start();

    session.frame('A', 100);
    session.frame('B', 100.2);
    vi.spyOn(Date, 'now').mockReturnValue(100_400);
    await recorder.stop();

    // 0.2 s at 15 fps is 3 frames each.
    expect(ffmpeg.frames).toEqual(['A', 'A', 'A', 'B', 'B', 'B']);
    expect(session.send).toHaveBeenCalledWith('Page.screencastFrameAck', {
      sessionId: 1
    });
    expect(session.send).toHaveBeenCalledWith('Page.stopScreencast');
    expect(session.detach).toHaveBeenCalled();
    expect(recorder.error).toBeNull();
  });

  it('survives ffmpeg rejecting frames instead of crashing the process', async () => {
    const { ffmpeg, session, start } = setup();
    const recorder = await start();
    ffmpeg.failWrites = new Error('write EOF');
    ffmpeg.exitOnEnd = false;

    session.frame('A', 100);
    session.frame('B', 101);
    await settle();
    ffmpeg.emit('close', 1, null);
    await recorder.stop();

    expect(recorder.error).toMatch(/write EOF/);
  });

  it('stops writing when ffmpeg exits early and reports it', async () => {
    const { ffmpeg, session, start } = setup();
    const recorder = await start();

    ffmpeg.emit('close', 1, null);
    session.frame('A', 100);
    session.frame('B', 100.2);
    await recorder.stop();

    expect(ffmpeg.frames).toEqual([]);
    expect(recorder.error).toMatch(/exited early \(code 1/);
  });

  it('reports a missing ffmpeg and stops without waiting for it', async () => {
    vi.useFakeTimers();
    const { ffmpeg, start } = setup();
    ffmpeg.exitOnEnd = false;
    const recorder = await start();

    // A process that never started emits 'error' and no 'close'.
    ffmpeg.emit('error', new Error('spawn ffmpeg.exe ENOENT'));
    let stopped = false;
    const stopping = recorder.stop().then(() => {
      stopped = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    await stopping;

    expect(stopped).toBe(true);
    expect(ffmpeg.kill).not.toHaveBeenCalled();
    expect(recorder.error).toMatch(/ENOENT/);
  });

  it('releases the CDP session when ffmpeg cannot be spawned', async () => {
    const { session } = setup();
    const page = {
      viewport: () => ({ width: 1400, height: 900 }),
      createCDPSession: vi.fn(async () => session)
    };

    await expect(
      RunRecorder.start(page as never, 'out.webm', 'ffmpeg.exe', () => {
        throw new Error('spawn EINVAL');
      })
    ).rejects.toThrow('spawn EINVAL');
    expect(session.detach).toHaveBeenCalled();
  });

  it('kills ffmpeg when it does not finish after stop', async () => {
    vi.useFakeTimers();
    const { ffmpeg, start } = setup();
    ffmpeg.exitOnEnd = false;
    const recorder = await start();

    const stopping = recorder.stop();
    await vi.advanceTimersByTimeAsync(10_000);
    await stopping;

    expect(ffmpeg.kill).toHaveBeenCalledWith('SIGKILL');
    expect(recorder.error).toMatch(/did not finish/);
  });

  it('stops ffmpeg and rejects when the screencast cannot start', async () => {
    const { ffmpeg, session, start } = setup();
    session.send.mockImplementation(async (method: string) => {
      if (method === 'Page.startScreencast') throw new Error('Target closed');
      return undefined;
    });

    await expect(start()).rejects.toThrow('Target closed');
    expect(ffmpeg.stdin.writableEnded).toBe(true);
  });

  it('returns the same stop when called twice', async () => {
    const { start } = setup();
    const recorder = await start();

    expect(recorder.stop()).toBe(recorder.stop());
    await recorder.stop();
  });
});

describe('frameRepeats', () => {
  it('rounds the time on screen to whole frames', () => {
    expect(frameRepeats(0.2)).toBe(3);
    expect(frameRepeats(0.01)).toBe(0);
    expect(frameRepeats(-1)).toBe(0);
  });

  it('caps a long gap at two minutes', () => {
    expect(frameRepeats(3600)).toBe(120 * RECORDING_FPS);
  });
});
