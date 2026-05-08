import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';

import {
  buildProviderDoctorReport,
  formatProviderDoctorReport,
  parseCliArgs
} from './provider-doctor.ts';
import { recordProviderObservation } from '../provider-observability/provider-observability.ts';

test('parseCliArgs supports provider filtering and json output', () => {
  assert.deepEqual(parseCliArgs(['--provider', 'gemini', '--json']), {
    json: true,
    provider: 'gemini'
  });
});

test('buildProviderDoctorReport respects the provider filter', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'provider-doctor-filter-'));

  try {
    recordProviderObservation(
      baseObservation({
        model: 'claude-sonnet-4.6',
        operation: 'health-probe',
        provider: 'copilot'
      }),
      tempRoot
    );
    recordProviderObservation(
      baseObservation({
        model: 'gemini-3-flash-preview',
        operation: 'health-probe',
        provider: 'gemini'
      }),
      tempRoot
    );

    const report = buildProviderDoctorReport({
      provider: 'gemini',
      repoRoot: tempRoot
    });

    assert.equal(report.buckets.length, 1);
    assert.equal(report.buckets[0]?.provider, 'gemini');
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('formatProviderDoctorReport includes timeout recommendations when enough data exists', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'provider-doctor-timeout-'));

  try {
    for (const durationMs of [1_000, 2_000, 3_000, 4_000, 5_000]) {
      recordProviderObservation(
        baseObservation({
          configuredTimeoutMs: 30_000,
          durationMs,
          model: 'claude-sonnet-4.6',
          operation: 'health-probe',
          provider: 'copilot',
          success: true,
          timedOut: false
        }),
        tempRoot
      );
    }

    const text = formatProviderDoctorReport(
      buildProviderDoctorReport({
        provider: 'copilot',
        repoRoot: tempRoot
      })
    );

    assert.match(text, /Recommended timeout: 15000ms/);
    assert.match(text, /Timeout p50\/p95: 3000ms \/ 5000ms/);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('formatProviderDoctorReport reports insufficient data instead of guessing', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'provider-doctor-insufficient-'));

  try {
    for (const durationMs of [1_000, 2_000, 3_000, 4_000]) {
      recordProviderObservation(
        baseObservation({
          configuredTimeoutMs: 30_000,
          durationMs,
          model: 'claude-sonnet-4.6',
          operation: 'health-probe',
          provider: 'copilot',
          success: true,
          timedOut: false
        }),
        tempRoot
      );
    }

    const text = formatProviderDoctorReport(
      buildProviderDoctorReport({
        provider: 'copilot',
        repoRoot: tempRoot
      })
    );

    assert.match(text, /Recommended timeout: insufficient data/);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('buildProviderDoctorReport exposes structured JSON-friendly data for gemini session policies', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'provider-doctor-gemini-'));

  try {
    for (let index = 0; index < 10; index += 1) {
      const sessionId = `session-${index}`;
      recordProviderObservation(
        baseObservation({
          attempt: 0,
          capacityError: index < 2,
          configuredTimeoutMs: 180_000,
          durationMs: 9_000,
          model: 'gemini-3-flash-preview',
          operation: 'review-attempt',
          provider: 'gemini',
          recordedAtMs: index * 10 + 1,
          sessionId,
          success: index >= 2,
          timedOut: false
        }),
        tempRoot
      );

      if (index < 2) {
        recordProviderObservation(
          baseObservation({
            attempt: 1,
            configuredTimeoutMs: 180_000,
            durationMs: 10_000,
            model: 'gemini-3-flash-preview',
            operation: 'review-attempt',
            provider: 'gemini',
            recordedAtMs: index * 10 + 2,
            sessionId,
            success: true,
            timedOut: false
          }),
          tempRoot
        );
      }
    }

    const report = buildProviderDoctorReport({
      provider: 'gemini',
      repoRoot: tempRoot
    });

    assert.equal(
      report.buckets[0]?.geminiIntervalRecommendation?.recommendedIntervalMs,
      32_000
    );
    assert.equal(
      report.buckets[0]?.geminiBackoffRecommendation?.insufficientData,
      true
    );
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

function baseObservation(
  input: Partial<Parameters<typeof recordProviderObservation>[0]> &
    Pick<
      Parameters<typeof recordProviderObservation>[0],
      | 'configuredTimeoutMs'
      | 'durationMs'
      | 'operation'
      | 'promptChars'
      | 'provider'
      | 'success'
      | 'timedOut'
    >
) {
  return {
    callsite: 'checkpoint-review' as const,
    checkpoint: 'plan' as const,
    errorCategory: null,
    promptChars: 10,
    recordedAtMs: 1,
    ...input
  };
}
