import type { CuratedLocaleTarget } from './ng-tag-build-locales/types.ts';

// Shared by the product-doc and tag-build converters. Seed loading and
// curated-id checks stay in those entrypoints because the paths differ.

export interface ExtractedTransUnit {
  readonly id: string;
  readonly source: string;
}

export interface TranslationSeed {
  readonly content: string;
  readonly isXmlFragment: boolean;
}

export type TranslationSeedMap = Map<string, TranslationSeed>;

export function parseTransUnits(xlf: string): ExtractedTransUnit[] {
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

export function parseTargets(
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

export function buildLocalizedXlf(
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
