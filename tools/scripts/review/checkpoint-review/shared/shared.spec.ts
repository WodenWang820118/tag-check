import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COPILOT_CLAUDE_MODEL,
  getDefaultGeminiModel
} from './shared.ts';

describe('getDefaultGeminiModel', () => {
  it('returns the gemini-3.5-flash-high model for every checkpoint', () => {
    expect(getDefaultGeminiModel()).toBe('gemini-3.5-flash-high');
  });
});

describe('default Copilot model constants', () => {
  it('exposes the Claude Sonnet default model', () => {
    expect(DEFAULT_COPILOT_CLAUDE_MODEL).toBe('claude-sonnet-4.6');
  });
});
