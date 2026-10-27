import { StreamableFile } from '@nestjs/common';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectVideoService } from './project-video.service';

const KEY = '0f0e6b2a-7c1d-4e5f-8a9b-1c2d3e4f5a6b';

describe('ProjectVideoService', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'tagcheck-video-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** Two runs, newest first; fileOf answers with `file` or null. */
  function build(file: string | null) {
    const testEventDetailRepositoryService = {
      listRunHistory: vi.fn().mockResolvedValue([
        { runId: 9, recordingKey: KEY },
        { runId: 7, recordingKey: null }
      ])
    };
    const runRecordingsService = { fileOf: vi.fn().mockResolvedValue(file) };
    const service = new ProjectVideoService(
      testEventDetailRepositoryService as never,
      runRecordingsService as never
    );
    return { service, runRecordingsService };
  }

  /** Reads the whole stream, also so the temp folder can be removed after. */
  async function read(result: StreamableFile): Promise<string> {
    const stream = result.getStream() as NodeJS.ReadableStream;
    let content = '';
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => (content += chunk.toString()));
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });
    return content;
  }

  it("streams the latest run's recording by default", async () => {
    const recording = join(dir, 'recording.webm');
    writeFileSync(recording, 'latest run');
    const { service, runRecordingsService } = build(recording);

    const result = await service.getVideos('demo', 'evt');

    expect(runRecordingsService.fileOf).toHaveBeenCalledWith(
      'demo',
      'evt',
      { recordingKey: KEY, latest: true },
      'recording.webm'
    );
    expect(await read(result)).toBe('latest run');
  });

  it("streams the chosen run's recording", async () => {
    const recording = join(dir, 'recording-tag-assistant.webm');
    writeFileSync(recording, 'older run');
    const { service, runRecordingsService } = build(recording);

    const result = await service.getVideos(
      'demo',
      'evt',
      'recording-tag-assistant.webm',
      7
    );

    expect(runRecordingsService.fileOf).toHaveBeenCalledWith(
      'demo',
      'evt',
      { recordingKey: null, latest: false },
      'recording-tag-assistant.webm'
    );
    expect(await read(result)).toBe('older run');
  });

  it('returns an empty file when the run kept no recording, or is not a run of the test', async () => {
    const { service, runRecordingsService } = build(null);

    expect(await read(await service.getVideos('demo', 'evt'))).toBe('');
    expect(
      await read(await service.getVideos('demo', 'evt', 'recording.webm', 404))
    ).toBe('');
    expect(runRecordingsService.fileOf).toHaveBeenCalledTimes(1);
  });
});
