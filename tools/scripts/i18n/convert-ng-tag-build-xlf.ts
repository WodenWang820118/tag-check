import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  localeTargets,
  requiredCuratedIds
} from './ng-tag-build-locales/index.ts';
import type { CuratedLocaleTarget } from './ng-tag-build-locales/types.ts';
import {
  buildLocalizedXlf,
  parseTargets,
  parseTransUnits,
  type ExtractedTransUnit,
  type TranslationSeed,
  type TranslationSeedMap
} from './xlf-localization.ts';

const rootDir = process.cwd();
const extractDir = join(rootDir, 'tmp/ng-tag-build-i18n-extract');
const sourceXlfPath = join(extractDir, 'messages.xlf');
const localeDir = join(rootDir, 'apps/ng-tag-build/src/locale');
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
    'ng-tag-build:extract-i18n',
    '--output-path',
    'tmp/ng-tag-build-i18n-extract',
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
    throw new Error('Failed to extract ng-tag-build i18n messages.');
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
  const gitPath = `HEAD:apps/ng-tag-build/src/locale/${fileName}`;
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
      `Extracted XLF is missing curated i18n ids: ${missingSourceIds.join(
        ', '
      )}`
    );
  }
}
