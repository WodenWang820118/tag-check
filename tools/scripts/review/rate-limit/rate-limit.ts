import fs from 'node:fs';
import path from 'node:path';

export interface RateLimitState {
  models: Record<string, { lastStartedAtMs: number }>;
}

export interface ModelRateLimitPolicy {
  model: string;
  targetIntervalMs: number;
  retryDelaysMs: number[];
  requestTimeoutMs: number;
}

const GEMINI_MODEL_ALIASES: Record<string, string> = {
  'gemini-3.1-flash-preview': 'gemini-3-flash-preview',
};

const MODEL_POLICIES: Record<string, Omit<ModelRateLimitPolicy, 'model'>> = {
  'gemini-2.5-pro': {
    targetIntervalMs: 38000,
    retryDelaysMs: [35000, 50000, 75000],
    requestTimeoutMs: 5 * 60 * 1000,
  },
  'gemini-3-flash-preview': {
    targetIntervalMs: 22000,
    retryDelaysMs: [20000, 30000],
    requestTimeoutMs: 3 * 60 * 1000,
  },
};

const DEFAULT_STATE: RateLimitState = {
  models: {},
};

const GEMINI_LOCK_STALE_MS = 10 * 60 * 1000;

export function normalizeGeminiModel(model: string): string {
  return GEMINI_MODEL_ALIASES[model] ?? model;
}

export function getModelRateLimitPolicy(model: string): ModelRateLimitPolicy {
  const normalizedModel = normalizeGeminiModel(model);
  const policy = MODEL_POLICIES[normalizedModel];

  if (!policy) {
    throw new Error(`Unsupported Gemini model for review throttling: ${model}`);
  }

  return {
    model: normalizedModel,
    ...policy,
  };
}

export function getRateLimitStatePath(repoRoot = process.cwd()): string {
  return path.join(repoRoot, '.cache', 'reviews', 'rate-limit-state.json');
}

export function loadRateLimitState(repoRoot = process.cwd()): RateLimitState {
  const statePath = getRateLimitStatePath(repoRoot);

  if (!fs.existsSync(statePath)) {
    return structuredClone(DEFAULT_STATE);
  }

  try {
    const raw = JSON.parse(
      fs.readFileSync(statePath, 'utf8'),
    ) as Partial<RateLimitState>;
    return {
      models: raw.models ?? {},
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveRateLimitState(
  state: RateLimitState,
  repoRoot = process.cwd(),
): void {
  const statePath = getRateLimitStatePath(repoRoot);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export function getInterRequestDelayMs(input: {
  model: string;
  nowMs: number;
  lastStartedAtMs?: number | null;
}): number {
  const policy = getModelRateLimitPolicy(input.model);

  if (!input.lastStartedAtMs) {
    return 0;
  }

  return Math.max(
    0,
    policy.targetIntervalMs - (input.nowMs - input.lastStartedAtMs),
  );
}

export function getRetryDelayMs(model: string, attempt: number): number {
  const retryDelaysMs = getModelRateLimitPolicy(model).retryDelaysMs;
  return retryDelaysMs[Math.min(attempt, retryDelaysMs.length - 1)];
}

export function recordRequestStart(
  model: string,
  startedAtMs: number,
  repoRoot = process.cwd(),
): void {
  const normalizedModel = normalizeGeminiModel(model);
  const state = loadRateLimitState(repoRoot);
  state.models[normalizedModel] = {
    lastStartedAtMs: startedAtMs,
  };
  saveRateLimitState(state, repoRoot);
}

export function getGeminiLockPath(repoRoot = process.cwd()): string {
  return path.join(repoRoot, '.cache', 'reviews', 'gemini.lock');
}

export async function acquireGeminiLock(
  repoRoot = process.cwd(),
  waitTimeoutMs = 5 * 60 * 1000,
): Promise<() => void> {
  const lockPath = getGeminiLockPath(repoRoot);
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });

  const lockToken = JSON.stringify({
    pid: process.pid,
    createdAtMs: Date.now(),
  });
  const startedWaitingAtMs = Date.now();

  while (true) {
    try {
      fs.writeFileSync(lockPath, lockToken, { flag: 'wx' });
      return () => {
        try {
          if (
            fs.existsSync(lockPath) &&
            fs.readFileSync(lockPath, 'utf8') === lockToken
          ) {
            fs.rmSync(lockPath, { force: true });
          }
        } catch {
          // Ignore release races from stale lock cleanup.
        }
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST') {
        throw error;
      }

      if (isLockStale(lockPath)) {
        fs.rmSync(lockPath, { force: true });
        continue;
      }

      if (Date.now() - startedWaitingAtMs >= waitTimeoutMs) {
        throw new Error('Timed out waiting for the Gemini review lock.');
      }

      await sleep(250);
    }
  }
}

function isLockStale(lockPath: string): boolean {
  try {
    const raw = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as {
      createdAtMs?: number;
    };
    return (
      !raw.createdAtMs || Date.now() - raw.createdAtMs > GEMINI_LOCK_STALE_MS
    );
  } catch {
    return true;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
