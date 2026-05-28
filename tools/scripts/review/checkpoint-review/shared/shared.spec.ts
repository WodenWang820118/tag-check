import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COPILOT_CLAUDE_MODEL,
  DEFAULT_COPILOT_GPT5_MINI_MODEL,
  getDefaultGeminiModel
} from './shared.ts';

describe('getDefaultGeminiModel', () => {
  it('returns the flash-preview model for implementation reviews', () => {
    expect(getDefaultGeminiModel('implementation')).toBe(
      'gemini-3.5-flash-high'
    );
  });

  it('returns the gemini-3.5-flash-high model for plan, test, and pre-merge reviews', () => {
    expect(getDefaultGeminiModel('plan')).toBe('gemini-3.5-flash-high');
    expect(getDefaultGeminiModel('test')).toBe('gemini-3.5-flash-high');
    expect(getDefaultGeminiModel('pre-merge')).toBe('gemini-3.5-flash-high');
  });
});

describe('default Copilot model constants', () => {
  it('exposes the Claude Sonnet default model', () => {
    expect(DEFAULT_COPILOT_CLAUDE_MODEL).toBe('claude-sonnet-4.6');
  });

  it('exposes the GPT-5 mini default model', () => {
    expect(DEFAULT_COPILOT_GPT5_MINI_MODEL).toBe('gpt-5-mini');
  });
});
