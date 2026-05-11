import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  localeTargets,
  requiredCuratedIds
} from './ng-tag-build-locales/index.ts';
import type { CuratedLocaleTarget } from './ng-tag-build-locales/types.ts';

interface ExtractedTransUnit {
  readonly id: string;
  readonly source: string;
}

interface TranslationSeed {
  readonly content: string;
  readonly isXmlFragment: boolean;
}

type TranslationSeedMap = Map<string, TranslationSeed>;

const rootDir = process.cwd();
const extractDir = join(rootDir, 'tmp/ng-product-doc-i18n-extract');
const sourceXlfPath = join(extractDir, 'messages.xlf');
const localeDir = join(rootDir, 'apps/ng-product-doc/src/locale');
const sourceLocalePath = join(localeDir, 'messages.xlf');

main();

function main(): void {
  runExtraction();

  const sourceXlf = readFileSync(sourceXlfPath, 'utf8');
  const sourceUnits = parseTransUnits(sourceXlf);

  mkdirSync(localeDir, { recursive: true });
  writeFileSync(sourceLocalePath, sourceXlf, 'utf8');

  for (const locale of localeTargets) {
    validateCuratedTranslations(locale, sourceUnits);

    const translations = loadLegacyTranslations(locale.file);

    for (const [id, content] of Object.entries(locale.curatedTranslations)) {
      translations.set(id, { content, isXmlFragment: false });
    }

    const localizedXlf = buildLocalizedXlf(sourceXlf, locale, translations);
    const outputPath = join(localeDir, locale.file);
    writeFileSync(outputPath, localizedXlf, 'utf8');
    console.log(`Wrote ${outputPath}`);
  }
}

function runExtraction(): void {
  const args = [
    'nx',
    'run',
    'ng-product-doc:extract-i18n',
    '--output-path',
    'tmp/ng-product-doc-i18n-extract',
    '--format',
    'xlf'
  ];

  const result =
    process.platform === 'win32'
      ? spawnSync(`pnpm ${args.join(' ')}`, {
          cwd: rootDir,
          encoding: 'utf8',
          shell: true,
          stdio: 'inherit'
        })
      : spawnSync('pnpm', args, {
          cwd: rootDir,
          encoding: 'utf8',
          shell: false,
          stdio: 'inherit'
        });

  if (result.status !== 0) {
    throw new Error('Failed to extract ng-product-doc i18n messages.');
  }

  if (!existsSync(sourceXlfPath)) {
    throw new Error(`Missing extracted source XLF at ${sourceXlfPath}.`);
  }
}

function loadLegacyTranslations(fileName: string): TranslationSeedMap {
  const legacyContent =
    readGitHeadLocaleFile(fileName) ?? readCurrentLocaleFile(fileName);

  const translations = new Map<string, TranslationSeed>();

  if (!legacyContent) {
    return translations;
  }

  for (const unit of parseTransUnits(legacyContent)) {
    translations.set(unit.id, { content: unit.source, isXmlFragment: true });
  }

  for (const { id, content } of parseTargets(legacyContent)) {
    translations.set(id, { content, isXmlFragment: true });
  }

  return translations;
}

function readGitHeadLocaleFile(fileName: string): string | null {
  const gitPath = `HEAD:apps/ng-product-doc/src/locale/${fileName}`;
  const result = spawnSync('git', ['show', gitPath], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: false
  });

  return result.status === 0 ? result.stdout : null;
}

function readCurrentLocaleFile(fileName: string): string | null {
  const path = join(localeDir, fileName);
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function parseTransUnits(xlf: string): ExtractedTransUnit[] {
  const units: ExtractedTransUnit[] = [];
  const transUnitRegex =
    /<trans-unit\b(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/trans-unit>/g;

  for (const match of xlf.matchAll(transUnitRegex)) {
    const id = extractId(match.groups?.['attributes'] ?? '');
    const source = match.groups?.['body']?.match(
      /<source>(?<source>[\s\S]*?)<\/source>/
    )?.groups?.['source'];

    if (id && source !== undefined) {
      units.push({ id, source });
    }
  }

  return units;
}

function parseTargets(
  xlf: string
): Array<{ readonly id: string; readonly content: string }> {
  const targets: Array<{ readonly id: string; readonly content: string }> = [];
  const transUnitRegex =
    /<trans-unit\b(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/trans-unit>/g;

  for (const match of xlf.matchAll(transUnitRegex)) {
    const id = extractId(match.groups?.['attributes'] ?? '');
    const target = match.groups?.['body']?.match(
      /<target>(?<target>[\s\S]*?)<\/target>/
    )?.groups?.['target'];

    if (id && target !== undefined) {
      targets.push({ id, content: target });
    }
  }

  return targets;
}

function extractId(attributes: string): string | null {
  return attributes.match(/\bid="(?<id>[^"]+)"/)?.groups?.['id'] ?? null;
}

function validateCuratedTranslations(
  locale: CuratedLocaleTarget,
  sourceUnits: readonly ExtractedTransUnit[]
): void {
  const sourceIds = new Set(sourceUnits.map(({ id }) => id));
  const missingCuratedValues = requiredCuratedIds.filter(
    (id) => locale.curatedTranslations[id] === undefined
  );
  const missingSourceIds = requiredCuratedIds.filter(
    (id) => !sourceIds.has(id)
  );

  if (missingCuratedValues.length > 0) {
    throw new Error(
      `${locale.code} is missing curated translations: ${missingCuratedValues.join(
        ', '
      )}`
    );
  }

  if (missingSourceIds.length > 0) {
    throw new Error(
      `Extracted XLF is missing curated i18n ids: ${missingSourceIds.join(', ')}`
    );
  }
}

function buildLocalizedXlf(
  sourceXlf: string,
  locale: CuratedLocaleTarget,
  translations: TranslationSeedMap
): string {
  return withTargetLanguage(sourceXlf, locale.code).replace(
    /<trans-unit\b[^>]*>[\s\S]*?<\/trans-unit>/g,
    (block) => localizeTransUnit(block, translations)
  );
}

function withTargetLanguage(sourceXlf: string, code: string): string {
  return sourceXlf.replace(/<file\b(?<attributes>[^>]*)>/, (fileTag) => {
    if (fileTag.includes('target-language=')) {
      return fileTag.replace(
        /\starget-language="[^"]*"/,
        ` target-language="${code}"`
      );
    }

    return fileTag.replace(/>$/, ` target-language="${code}">`);
  });
}

function localizeTransUnit(
  block: string,
  translations: TranslationSeedMap
): string {
  const attributes = block.match(/^<trans-unit\b(?<attributes>[^>]*)>/)
    ?.groups?.['attributes'];
  const id = attributes ? extractId(attributes) : null;
  const body = block.match(
    /^<trans-unit\b[^>]*>(?<body>[\s\S]*?)<\/trans-unit>$/
  )?.groups?.['body'];

  if (!id || body === undefined) {
    return block;
  }

  const sourceMatch = body.match(
    /(?<indent>\s*)<source>(?<source>[\s\S]*?)<\/source>/
  );

  if (!sourceMatch?.groups) {
    return block;
  }

  const sourceIndent = sourceMatch.groups['indent'] ?? '\n        ';
  const source = sourceMatch.groups['source'] ?? '';
  const sourceIndex = sourceMatch.index ?? 0;
  const beforeSource = body.slice(0, sourceIndex);
  const sourceBlock = sourceMatch[0];
  const afterSource = body.slice(sourceIndex + sourceBlock.length);
  const afterSourceWithoutTarget = afterSource.replace(
    /^\s*<target\b[^>]*>[\s\S]*?<\/target>/,
    ''
  );
  const translation = translations.get(id);
  const targetContent = translation ? renderTargetContent(translation) : source;

  return [
    `<trans-unit${attributes}>`,
    beforeSource,
    sourceBlock,
    `${sourceIndent}<target>${targetContent}</target>`,
    afterSourceWithoutTarget,
    '</trans-unit>'
  ].join('');
}

function renderTargetContent(translation: TranslationSeed): string {
  return translation.isXmlFragment
    ? translation.content
    : escapeXml(translation.content);
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
