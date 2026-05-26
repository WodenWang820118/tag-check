import { describe, expect, it } from 'vitest';
import { buildReviewPrompt, parseCliArgs } from './cli-args-and-prompt.ts';

describe('parseCliArgs', () => {
  it('returns sensible defaults for an empty argument vector', () => {
    expect(parseCliArgs([])).toEqual({ provider: 'auto', focus: 'general' });
  });

  it('parses every supported flag', () => {
    const parsed = parseCliArgs([
      '--checkpoint',
      'implementation',
      '--focus',
      'security',
      '--provider',
      'gemini',
      '--model',
      'gemini-3.5-flash-high',
      '--context-file',
      'ctx.txt'
    ]);
    expect(parsed).toEqual({
      checkpoint: 'implementation',
      focus: 'security',
      provider: 'gemini',
      model: 'gemini-3.5-flash-high',
      contextFile: 'ctx.txt'
    });
  });

  it('throws on unknown flags', () => {
    expect(() => parseCliArgs(['--bogus'])).toThrow(/Unknown review flag/);
  });

  it('throws on unsupported checkpoint values', () => {
    expect(() => parseCliArgs(['--checkpoint', 'wat'])).toThrow(
      /Unsupported checkpoint/
    );
  });

  it('throws on unsupported provider values', () => {
    expect(() => parseCliArgs(['--provider', 'wat'])).toThrow(
      /Unsupported provider/
    );
  });

  it('throws when --focus is provided without a value', () => {
    expect(() => parseCliArgs(['--focus'])).toThrow(
      /Missing value for --focus/
    );
  });
});

describe('buildReviewPrompt', () => {
  const execution = {
    checkpoint: 'implementation' as const,
    focus: 'security',
    provider: 'gemini' as const,
    model: 'gemini-3.5-flash-high'
  };

  it('includes the checkpoint, focus, model, and context in the prompt', () => {
    const prompt = buildReviewPrompt(execution, 'diff text here', {
      commonReviewContract: ''
    });
    expect(prompt).toContain('Checkpoint: implementation');
    expect(prompt).toContain('Primary focus: security');
    expect(prompt).toContain('Requested model: gemini-3.5-flash-high');
    expect(prompt).toContain('diff text here');
  });

  it('embeds the shared review contract when provided', () => {
    const prompt = buildReviewPrompt(execution, 'ctx', {
      commonReviewContract: 'CONTRACT-RULES'
    });
    expect(prompt).toContain('Shared review contract:');
    expect(prompt).toContain('CONTRACT-RULES');
  });

  it('adds the implementation-specific escalation rule for implementation reviews', () => {
    const prompt = buildReviewPrompt(execution, 'ctx', {
      commonReviewContract: ''
    });
    expect(prompt).toMatch(/escalated to Copilot/);
    expect(prompt).not.toMatch(/missing scenarios/);
  });

  it('adds the test-focused rule for test reviews', () => {
    const prompt = buildReviewPrompt(
      { ...execution, checkpoint: 'test' },
      'ctx',
      { commonReviewContract: '' }
    );
    expect(prompt).toMatch(/missing scenarios, weak assertions/);
    expect(prompt).not.toMatch(/escalated to Copilot/);
  });

  it('omits the model line when no model is supplied', () => {
    const { model: _model, ...noModel } = execution;
    const prompt = buildReviewPrompt(noModel, 'ctx', {
      commonReviewContract: ''
    });
    expect(prompt).not.toContain('Requested model:');
  });
});
