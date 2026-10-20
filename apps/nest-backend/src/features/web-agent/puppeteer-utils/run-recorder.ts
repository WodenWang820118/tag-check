import { Logger } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import type { CDPSession, Page, Protocol } from 'puppeteer';

/** Frames per second written to the recording. */
export const RECORDING_FPS = 15;
/** Longest gap one frame may fill, so a stalled page cannot flood ffmpeg. */
const MAX_FRAME_SECONDS = 120;
const STOP_TIMEOUT_MS = 10_000;
const STDERR_TAIL_CHARS = 2_000;

type SpawnFfmpeg = (ffmpegPath: string, args: string[]) => ChildProcess;

const spawnFfmpeg: SpawnFfmpeg = (ffmpegPath, args) =>
  spawn(ffmpegPath, args, {
    stdio: ['pipe', 'ignore', 'pipe'],
    windowsHide: true
  });

/** The ffmpeg arguments for a VP9 WebM of the given (even) size. */
export function recordingArgs(
  width: number,
  height: number,
  file: string
): string[] {
  return [
    ['-loglevel', 'error'],
    // JPEG frames from the screencast, read from stdin at a fixed rate.
    ['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', `${RECORDING_FPS}`],
    ['-i', 'pipe:0'],
    ['-an'],
    // Fit every frame into one size: the encoder cannot change size mid-run.
    [
      '-vf',
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`
    ],
    ['-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8'],
    ['-row-mt', '1', '-b:v', '0', '-crf', '34'],
    // Writing to a file lets the muxer record the duration and cues, so
    // players can show the length and seek.
    ['-y', file]
  ].flat();
}

/** How many times a frame repeats to fill `seconds` at RECORDING_FPS. */
export function frameRepeats(seconds: number): number {
  const bounded = Math.min(Math.max(seconds, 0), MAX_FRAME_SECONDS);
  return Math.round(bounded * RECORDING_FPS);
}

const toEven = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/**
 * Records a page to a WebM file from Chrome DevTools screencast frames.
 *
 * Replaces Puppeteer's page.screencast(). Its ScreenRecorder writes frames to
 * ffmpeg's stdin without an 'error' listener, so when ffmpeg exits first the
 * failed write is an unhandled 'error' event and the whole Node process exits.
 * Here the recorder owns ffmpeg: if ffmpeg fails, the run loses its recording
 * and logs why, and the server keeps running.
 */
export class RunRecorder {
  private readonly logger = new Logger(RunRecorder.name);
  private lastFrame: { data: Buffer; timestamp: number } | null = null;
  private writes: Promise<void> = Promise.resolve();
  private stopping: Promise<void> | null = null;
  private failure: string | null = null;
  private stderrTail = '';
  private readonly exited: Promise<void>;

  private constructor(
    private readonly session: CDPSession,
    private readonly ffmpeg: ChildProcess,
    readonly file: string
  ) {
    this.exited = new Promise((resolve) => {
      ffmpeg.once('close', (code, signal) => {
        if (!this.stopping) {
          this.fail(`ffmpeg exited early (code ${code}, signal ${signal})`);
        }
        resolve();
      });
      ffmpeg.on('error', (error) => {
        this.fail(`ffmpeg failed: ${error.message}`);
        // A process that never started may never emit 'close'.
        if (ffmpeg.pid === undefined) resolve();
      });
    });
    ffmpeg.stdin?.on('error', (error) =>
      this.fail(`writing frames to ffmpeg failed: ${error.message}`)
    );
    ffmpeg.stderr?.on('data', (chunk: Buffer) => {
      this.stderrTail = (this.stderrTail + chunk.toString('utf8')).slice(
        -STDERR_TAIL_CHARS
      );
    });
    session.on('Page.screencastFrame', (event) => this.onFrame(event));
  }

  /** Starts ffmpeg and the page's screencast at the page's viewport size. */
  static async start(
    page: Page,
    file: string,
    ffmpegPath: string,
    spawnProcess: SpawnFfmpeg = spawnFfmpeg
  ): Promise<RunRecorder> {
    const viewport =
      page.viewport() ??
      (await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight
      })));
    const width = toEven(viewport.width);
    const height = toEven(viewport.height);

    const session = await page.createCDPSession();
    let ffmpeg: ChildProcess;
    try {
      ffmpeg = spawnProcess(ffmpegPath, recordingArgs(width, height, file));
    } catch (error) {
      await session.detach().catch(() => undefined);
      throw error;
    }
    const recorder = new RunRecorder(session, ffmpeg, file);
    try {
      await session.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 80,
        maxWidth: width,
        maxHeight: height
      });
    } catch (error) {
      await recorder.stop();
      throw error;
    }
    return recorder;
  }

  /** Why the recording failed, or null while it is healthy. */
  get error(): string | null {
    return this.failure;
  }

  /**
   * Stops the screencast, writes the last frame up to now and waits for
   * ffmpeg to finish the file. Never throws; calling it again waits for the
   * same stop.
   */
  stop(): Promise<void> {
    this.stopping ??= this.finish();
    return this.stopping;
  }

  private async finish(): Promise<void> {
    await this.session.send('Page.stopScreencast').catch(() => undefined);
    const last = this.lastFrame;
    if (last) {
      this.enqueue(
        last.data,
        Math.max(1, frameRepeats(Date.now() / 1000 - last.timestamp))
      );
    }
    // Bounded: an ffmpeg that stops reading would otherwise hold the run.
    const flushed = (async () => {
      await this.writes;
      this.ffmpeg.stdin?.end();
      await this.exited;
      return true as const;
    })();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), STOP_TIMEOUT_MS);
    });
    const closed = await Promise.race([flushed, timedOut]);
    clearTimeout(timer);
    if (!closed) {
      this.ffmpeg.kill('SIGKILL');
      this.fail(`ffmpeg did not finish within ${STOP_TIMEOUT_MS}ms`);
    }
    await this.session.detach().catch(() => undefined);

    if (this.failure) {
      this.logger.warn(
        `Recording ${this.file} is incomplete: ${this.failure}. ffmpeg: ${this.stderrTail.trim() || '(no output)'}`
      );
    }
  }

  private onFrame({
    data,
    metadata,
    sessionId
  }: Protocol.Page.ScreencastFrameEvent): void {
    void this.session
      .send('Page.screencastFrameAck', { sessionId })
      .catch(() => undefined);
    if (this.stopping || this.failure) return;

    const frame = {
      data: Buffer.from(data, 'base64'),
      timestamp: metadata.timestamp ?? Date.now() / 1000
    };
    const previous = this.lastFrame;
    this.lastFrame = frame;
    // A frame stays on screen until the next one arrives.
    if (previous) {
      this.enqueue(
        previous.data,
        frameRepeats(frame.timestamp - previous.timestamp)
      );
    }
  }

  private enqueue(data: Buffer, repeats: number): void {
    this.writes = this.writes.then(() => this.write(data, repeats));
  }

  private async write(data: Buffer, repeats: number): Promise<void> {
    const stdin = this.ffmpeg.stdin;
    for (let i = 0; i < repeats; i++) {
      if (this.failure || !stdin || stdin.destroyed || stdin.writableEnded) {
        return;
      }
      if (!stdin.write(data)) {
        await new Promise<void>((resolve) => {
          const done = () => {
            stdin.off('drain', done);
            stdin.off('close', done);
            resolve();
          };
          stdin.once('drain', done);
          stdin.once('close', done);
        });
      }
    }
  }

  private fail(reason: string): void {
    this.failure ??= reason;
  }
}
