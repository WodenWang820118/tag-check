import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const HEALTHY_TTL_MS = 5 * 60 * 1000;
const UNHEALTHY_TTL_MS = 90 * 1000;

export interface ReviewProviderHealthResult {
  available: boolean;
  checkedAtMs: number;
  reason?: string;
  source: 'cache' | 'probe';
}

interface StoredReviewProviderHealthResult {
  available: boolean;
  checkedAtMs: number;
  reason?: string;
}

interface ReviewProviderHealthState {
  entries: Record<string, StoredReviewProviderHealthResult>;
}

export function createProviderHealthCacheKey(
  provider: string,
  model?: string,
): string {
  return model ? `${provider}:${model}` : provider;
}

export function getProviderHealthStatePath(repoRoot = process.cwd()): string {
  return path.join(repoRoot, '.cache', 'reviews', 'provider-health-state.json');
}

export function loadProviderHealthState(
  repoRoot = process.cwd(),
): ReviewProviderHealthState {
  const statePath = getProviderHealthStatePath(repoRoot);

  if (!existsSync(statePath)) {
    return { entries: {} };
  }

  try {
    return JSON.parse(
      readFileSync(statePath, 'utf8'),
    ) as ReviewProviderHealthState;
  } catch {
    return { entries: {} };
  }
}

export function saveProviderHealthState(
  state: ReviewProviderHealthState,
  repoRoot = process.cwd(),
): void {
  const statePath = getProviderHealthStatePath(repoRoot);
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export function getCachedProviderHealth(
  provider: string,
  model?: string,
  repoRoot = process.cwd(),
  nowMs = Date.now(),
): ReviewProviderHealthResult | null {
  const state = loadProviderHealthState(repoRoot);
  const cacheKey = createProviderHealthCacheKey(provider, model);
  const cached = state.entries[cacheKey];

  if (!cached) {
    return null;
  }

  const ttlMs = cached.available ? HEALTHY_TTL_MS : UNHEALTHY_TTL_MS;
  if (nowMs - cached.checkedAtMs > ttlMs) {
    return null;
  }

  return {
    ...cached,
    source: 'cache',
  };
}

export function cacheProviderHealth(
  provider: string,
  model: string | undefined,
  result: Omit<ReviewProviderHealthResult, 'source'>,
  repoRoot = process.cwd(),
): ReviewProviderHealthResult {
  const state = loadProviderHealthState(repoRoot);
  state.entries[createProviderHealthCacheKey(provider, model)] = {
    available: result.available,
    checkedAtMs: result.checkedAtMs,
    reason: result.reason,
  };
  saveProviderHealthState(state, repoRoot);

  return {
    ...result,
    source: 'probe',
  };
}
