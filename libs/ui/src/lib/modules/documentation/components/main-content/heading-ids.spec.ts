import { describe, expect, it } from 'vitest';
import { buildHeadingIds } from './heading-ids';

describe('buildHeadingIds', () => {
  it('slugifies English headings', () => {
    expect(buildHeadingIds(['Getting Started', "What's next?"])).toEqual([
      'getting-started',
      'what-s-next'
    ]);
  });

  it('gives Japanese and Chinese headings distinct ids', () => {
    const ids = buildHeadingIds([
      'クイックスタート',
      '1. プロジェクトを作成する',
      '設定詳情',
      '使用案例'
    ]);

    expect(ids).toEqual([
      'クイックスタート',
      '1-プロジェクトを作成する',
      '設定詳情',
      '使用案例'
    ]);
  });

  it('suffixes repeated headings so every id is unique', () => {
    expect(buildHeadingIds(['Setup', 'Setup', 'Setup 2', '!!!'])).toEqual([
      'setup',
      'setup-2',
      'setup-2-2',
      'section'
    ]);
  });
});
