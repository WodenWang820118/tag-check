import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  compareWithBaseline,
  flattenKnipReport,
  formatKey,
  mergeModes,
  parseHookPayload,
  parseRustAllows,
  parseVultureOutput,
  touchesCode
} from './dead-code-gate.ts';

test('flattenKnipReport produces line-free keys per mode, type, file and symbol', () => {
  const keys = flattenKnipReport(
    {
      issues: [
        {
          file: 'libs/ui/a.ts',
          exports: [{ name: 'foo', line: 3 }],
          files: [{ name: 'libs/ui/a.ts' }]
        },
        { file: 'x.ts', duplicates: [[{ name: 'b' }, { name: 'a' }]] },
        { file: 'y.ts', enumMembers: { E: { name: 'OFF' } } }
      ]
    },
    'default'
  );
  assert.deepEqual(keys, [
    'default|duplicates|x.ts|a+b',
    'default|enumMembers|y.ts|OFF',
    'default|exports|libs/ui/a.ts|foo',
    'default|files|libs/ui/a.ts|libs/ui/a.ts'
  ]);
});

test('parseVultureOutput keeps low-confidence callables, drops low-confidence fields, numbers repeats', () => {
  const output = [
    "src\\app\\store.py:2863: unused method 'acknowledge' (60% confidence)",
    "src\\app\\models.py:12: unused variable 'model_config' (60% confidence)",
    "src\\app\\html_text.py:65: unused variable 'attrs' (100% confidence)",
    "src\\app\\html_text.py:68: unused variable 'attrs' (100% confidence)",
    "src\\app\\x.py:9: unreachable code after 'return' (100% confidence)"
  ].join('\r\n');
  assert.deepEqual(parseVultureOutput(output, 'apps/ai'), [
    'python|method|apps/ai/src/app/store.py|acknowledge',
    'python|unreachable-code|apps/ai/src/app/x.py|unreachable-code',
    'python|variable|apps/ai/src/app/html_text.py|attrs',
    'python|variable|apps/ai/src/app/html_text.py|attrs#2'
  ]);
});

test('parseVultureOutput resolves paths outside cwd and applies the library threshold', () => {
  const output = [
    "..\\..\\packages\\client\\src\\api.py:10: unused method 'list_jobs' (60% confidence)",
    "..\\..\\packages\\client\\src\\api.py:20: unused import 'os' (90% confidence)"
  ].join('\n');
  assert.deepEqual(parseVultureOutput(output, 'apps/backend', true), [
    'python|import|packages/client/src/api.py|os'
  ]);
});

test('parseRustAllows freezes each allow(dead_code) attribute per file', () => {
  const output = [
    'src/health.rs:35:#[cfg_attr(not(test), allow(dead_code))]',
    'src/health.rs:109:#[allow(dead_code)]',
    'src/index.rs:8:#![allow(dead_code)]'
  ].join('\n');
  assert.deepEqual(parseRustAllows(output), [
    'rust|allow-dead-code|src/health.rs|allow(dead_code)',
    'rust|allow-dead-code|src/health.rs|allow(dead_code)#2',
    'rust|allow-dead-code|src/index.rs|allow(dead_code)'
  ]);
  assert.deepEqual(parseRustAllows(''), []);
});

test('mergeModes keeps a production key only when tests still use the symbol', () => {
  assert.deepEqual(
    mergeModes(
      ['default|exports|a.ts|unused'],
      ['production|exports|a.ts|unused', 'production|exports|a.ts|testOnly']
    ),
    ['default|exports|a.ts|unused', 'production|exports|a.ts|testOnly']
  );
});

test('compareWithBaseline reports new findings as added and vanished ones as stale', () => {
  assert.deepEqual(compareWithBaseline(['a', 'c'], ['a', 'b']), {
    added: ['c'],
    stale: ['b']
  });
});

test('touchesCode runs the hook for source, template and manifest changes only', () => {
  assert.equal(touchesCode(['apps/web/src/a.component.html']), true);
  assert.equal(touchesCode(['apps/ai/src/app/x.py']), true);
  assert.equal(touchesCode(['apps/desktop/src-tauri/src/main.rs']), true);
  assert.equal(touchesCode(['apps/desktop/src-tauri/Cargo.toml']), true);
  assert.equal(touchesCode(['apps/ai/pyproject.toml']), true);
  assert.equal(touchesCode(['knip.json']), true);
  assert.equal(touchesCode(['docs/a.md', 'docs/a.png']), false);
  assert.equal(touchesCode([]), false);
});

test('formatKey labels test-only, python and rust findings', () => {
  assert.equal(
    formatKey('production|exports|libs/a.ts|foo'),
    '  - [exports] (only tests use it) libs/a.ts :: foo'
  );
  assert.equal(
    formatKey('python|method|apps/ai/src/x.py|run'),
    '  - [method] (python; unused outside tests) apps/ai/src/x.py :: run'
  );
  assert.equal(
    formatKey('rust|allow-dead-code|src/a.rs|allow(dead_code)'),
    '  - [allow-dead-code] (rust; remove the attribute and the dead code it hides) src/a.rs :: allow(dead_code)'
  );
  assert.equal(formatKey('default|files|a.ts|a.ts'), '  - [files] a.ts');
});

test('parseHookPayload reads stop_hook_active and treats bad input as a normal stop', () => {
  assert.deepEqual(parseHookPayload('{"stop_hook_active":true}'), {
    stop_hook_active: true
  });
  assert.deepEqual(parseHookPayload(''), {});
  assert.deepEqual(parseHookPayload('not json'), {});
  assert.deepEqual(parseHookPayload('null'), {});
});
