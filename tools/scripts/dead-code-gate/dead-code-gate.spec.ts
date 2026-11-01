import { describe, expect, it } from 'vitest';
import {
  compareWithBaseline,
  flattenKnipReport,
  formatKey,
  mergeModes,
  touchesCode
} from './dead-code-gate.ts';

describe('flattenKnipReport', () => {
  it('produces line-free keys per mode, type, file and symbol', () => {
    const keys = flattenKnipReport(
      {
        issues: [
          {
            file: 'libs/utils/a.ts',
            exports: [{ name: 'foo', line: 3 }],
            types: [],
            files: [{ name: 'libs/utils/a.ts' }]
          },
          {
            file: 'package.json',
            devDependencies: [{ name: 'style-loader', line: 9 }]
          }
        ]
      },
      'default'
    );
    expect(keys).toEqual([
      'default|devDependencies|package.json|style-loader',
      'default|exports|libs/utils/a.ts|foo',
      'default|files|libs/utils/a.ts|libs/utils/a.ts'
    ]);
  });

  it('collapses a duplicate-export group into one order-independent key', () => {
    const keys = flattenKnipReport(
      {
        issues: [
          {
            file: 'x.ts',
            duplicates: [[{ name: 'b' }, { name: 'a' }]]
          }
        ]
      },
      'production'
    );
    expect(keys).toEqual(['production|duplicates|x.ts|a+b']);
  });

  it('accepts object-shaped issue maps', () => {
    const keys = flattenKnipReport(
      { issues: [{ file: 'x.ts', enumMembers: { E: { name: 'OFF' } } }] },
      'default'
    );
    expect(keys).toEqual(['default|enumMembers|x.ts|OFF']);
  });
});

describe('compareWithBaseline', () => {
  it('reports only new findings as added and vanished ones as stale', () => {
    expect(compareWithBaseline(['a', 'c'], ['a', 'b'])).toEqual({
      added: ['c'],
      stale: ['b']
    });
  });
});

describe('mergeModes', () => {
  it('keeps a production key only when tests still use the symbol', () => {
    expect(
      mergeModes(
        ['default|exports|a.ts|unused'],
        ['production|exports|a.ts|unused', 'production|exports|a.ts|testOnly']
      )
    ).toEqual([
      'default|exports|a.ts|unused',
      'production|exports|a.ts|testOnly'
    ]);
  });
});

describe('touchesCode', () => {
  it('runs the hook for source, template and manifest changes only', () => {
    expect(touchesCode(['apps/x/src/a.component.ts'])).toBe(true);
    expect(touchesCode(['apps/x/src/a.component.html'])).toBe(true);
    expect(touchesCode(['package.json'])).toBe(true);
    expect(touchesCode(['knip.json'])).toBe(true);
    expect(touchesCode(['README.md', 'docs/a.png'])).toBe(false);
    expect(touchesCode([])).toBe(false);
  });
});

describe('formatKey', () => {
  it('flags production-only findings as test-only usage', () => {
    expect(formatKey('production|exports|libs/a.ts|foo')).toBe(
      '  - [exports] (only tests use it) libs/a.ts :: foo'
    );
    expect(formatKey('default|files|libs/a.ts|libs/a.ts')).toBe(
      '  - [files] libs/a.ts'
    );
  });
});
