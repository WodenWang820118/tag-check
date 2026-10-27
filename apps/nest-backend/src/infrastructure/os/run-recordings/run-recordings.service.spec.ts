import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RUN_RECORDINGS_KEPT, type StepFallback } from '@utils';
import {
  RunRecordingsService,
  STEP_FAILURE_FILE,
  STEP_FALLBACKS_FILE
} from './run-recordings.service';

/** A run's recording key: a UUID, the n-th one for a test. */
const key = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('RunRecordingsService', () => {
  let root: string;
  let repository: {
    listRecordingKeys: ReturnType<typeof vi.fn>;
    clearRecordingKeys: ReturnType<typeof vi.fn>;
  };
  let service: RunRecordingsService;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'run-recordings-'));
    repository = {
      listRecordingKeys: vi.fn().mockResolvedValue([]),
      clearRecordingKeys: vi.fn().mockResolvedValue(undefined)
    };
    service = new RunRecordingsService(
      {
        getInspectionEventFolderPath: vi.fn(
          async (_projectSlug: string, eventId: string) => join(root, eventId)
        )
      } as never,
      repository as never
    );
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  /** Writes a run's recording, in its own folder or the test's. */
  function record(
    eventId: string,
    recordingKey: string | null,
    file = 'recording.webm'
  ) {
    const folder = recordingKey
      ? join(root, eventId, 'runs', recordingKey)
      : join(root, eventId);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, file), 'webm');
    return join(folder, file);
  }

  it("puts a run's recordings in a folder named by its key, and refuses anything else", async () => {
    expect(await service.folderOf('demo', 'cart', key(1))).toBe(
      join(root, 'cart', 'runs', key(1))
    );
    await expect(
      service.folderOf('demo', 'cart', '../../other')
    ).rejects.toThrow('Not a recording key');
  });

  it("finds a run's own recording, or the old one of the latest run", async () => {
    const own = record('cart', key(1));
    const old = record('cart', null);

    expect(
      await service.fileOf(
        'demo',
        'cart',
        { recordingKey: key(1), latest: false },
        'recording.webm'
      )
    ).toBe(own);
    expect(
      await service.fileOf(
        'demo',
        'cart',
        { recordingKey: null, latest: true },
        'recording.webm'
      )
    ).toBe(old);
    expect(
      await service.fileOf(
        'demo',
        'cart',
        { recordingKey: null, latest: false },
        'recording.webm'
      )
    ).toBeNull();
    expect(
      await service.fileOf(
        'demo',
        'cart',
        { recordingKey: key(1), latest: true },
        'recording-tag-assistant.webm'
      )
    ).toBeNull();
  });

  it(`keeps the recordings of the latest ${RUN_RECORDINGS_KEPT} runs`, async () => {
    const runs = Array.from({ length: RUN_RECORDINGS_KEPT + 2 }, (_, i) => ({
      id: 100 - i,
      recordingKey: key(i)
    }));
    for (const run of runs) record('cart', run.recordingKey);
    repository.listRecordingKeys.mockResolvedValue(runs);

    await service.prune('demo', 'cart', 3);

    expect(repository.listRecordingKeys).toHaveBeenCalledWith(3);
    expect(repository.clearRecordingKeys).toHaveBeenCalledWith([
      runs[RUN_RECORDINGS_KEPT].id,
      runs[RUN_RECORDINGS_KEPT + 1].id
    ]);
    expect(existsSync(join(root, 'cart', 'runs', key(0)))).toBe(true);
    expect(
      existsSync(join(root, 'cart', 'runs', key(RUN_RECORDINGS_KEPT - 1)))
    ).toBe(true);
    expect(
      existsSync(join(root, 'cart', 'runs', key(RUN_RECORDINGS_KEPT)))
    ).toBe(false);
  });

  it('never throws while pruning', async () => {
    repository.listRecordingKeys.mockRejectedValue(
      new Error('database is locked')
    );

    await expect(service.prune('demo', 'cart', 3)).resolves.toBeUndefined();
  });

  it("removes deleted runs' folders and the test's old recordings", async () => {
    record('cart', key(1));
    record('cart', key(2));
    record('cart', null);
    record('cart', null, 'recording-tag-assistant.webm');

    await service.removeRuns('demo', [
      { eventId: 'cart', recordingKey: key(1) }
    ]);
    await service.removeLegacy('demo', 'cart');

    expect(existsSync(join(root, 'cart', 'runs', key(1)))).toBe(false);
    expect(existsSync(join(root, 'cart', 'runs', key(2)))).toBe(true);
    expect(existsSync(join(root, 'cart', 'recording.webm'))).toBe(false);
    expect(existsSync(join(root, 'cart', 'recording-tag-assistant.webm'))).toBe(
      false
    );
  });

  it("removes everything deleted tests' runs left", async () => {
    record('cart', key(1));
    record('purchase', key(2));

    await service.removeTests('demo', ['cart', 'missing']);

    expect(existsSync(join(root, 'cart'))).toBe(false);
    expect(existsSync(join(root, 'purchase'))).toBe(true);
  });
  describe('step failures', () => {
    const context = {
      stepIndex: 3,
      stepType: 'click',
      selectors: [{ selector: '#gone', matches: 0 }],
      timeoutMs: 15000,
      offset: null,
      url: 'https://example.test/',
      title: 'Example',
      viewport: { width: 1280, height: 800 },
      candidates: [],
      candidatesFound: 0,
      capturedAt: '2026-10-27T10:00:00.000Z'
    };

    it("keeps what a run's step saw in the run's folder", async () => {
      await expect(
        service.saveStepFailure('demo', 'e1', key(1), context)
      ).resolves.toBe(true);

      expect(
        existsSync(join(root, 'e1', 'runs', key(1), STEP_FAILURE_FILE))
      ).toBe(true);
      await expect(
        service.readStepFailure('demo', 'e1', key(1))
      ).resolves.toEqual(context);
    });

    it('reads null for a run that kept none', async () => {
      await expect(
        service.readStepFailure('demo', 'e1', key(2))
      ).resolves.toBeNull();
    });

    it('reports a failed save without throwing', async () => {
      await expect(
        service.saveStepFailure('demo', 'e1', 'not-a-key', context)
      ).resolves.toBe(false);
    });

    it('rejects a key that is not a run key', async () => {
      await expect(
        service.readStepFailure('demo', 'e1', '../../etc')
      ).rejects.toThrow('Not a recording key');
    });
  });
  describe('step fallbacks', () => {
    const fallbacks: StepFallback[] = [
      {
        stepIndex: 4,
        stepType: 'click',
        selector: '[data-testid="add-to-cart"]',
        selectors: ['[data-testid="add-to-cart"]'],
        matchedBy: 'testId',
        value: 'add-to-cart'
      }
    ];

    it("keeps the run's fallbacks in its folder", async () => {
      await expect(
        service.saveStepFallbacks('demo', 'e1', key(1), fallbacks)
      ).resolves.toBe(true);

      expect(
        existsSync(join(root, 'e1', 'runs', key(1), STEP_FALLBACKS_FILE))
      ).toBe(true);
      await expect(
        service.readStepFallbacks('demo', 'e1', key(1))
      ).resolves.toEqual(fallbacks);
    });

    it('reads none for a run that used none', async () => {
      await expect(
        service.readStepFallbacks('demo', 'e1', key(2))
      ).resolves.toEqual([]);
    });
  });
});
