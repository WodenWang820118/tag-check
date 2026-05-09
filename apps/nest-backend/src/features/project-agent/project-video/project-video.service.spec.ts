import { StreamableFile } from '@nestjs/common';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectVideoService } from './project-video.service';

describe('ProjectVideoService', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'tagcheck-video-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function build(folder: string) {
    const folderPathService = {
      getInspectionEventFolderPath: vi.fn().mockResolvedValue(folder)
    };
    return new ProjectVideoService(folderPathService as never);
  }

  it('returns a StreamableFile backed by the recording.webm file when it exists', async () => {
    const recording = join(dir, 'recording.webm');
    writeFileSync(recording, Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    const service = build(dir);
    const result = await service.getVideos('demo', 'evt');
    expect(result).toBeInstanceOf(StreamableFile);
    // Fully consume the underlying read stream before the temp directory
    // teardown so a lazy open() can't race with rmSync and surface an
    // unhandled ENOENT during the test run.
    const stream = result.getStream() as NodeJS.ReadableStream;
    await new Promise<void>((resolve, reject) => {
      stream.on('data', () => undefined);
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });
  });

  it('returns an empty StreamableFile when the recording does not exist', async () => {
    const service = build(dir);
    const result = await service.getVideos('demo', 'missing');
    expect(result).toBeInstanceOf(StreamableFile);
  });
});
