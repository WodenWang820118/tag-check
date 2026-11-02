import { describe, expect, it } from 'vitest';

import type { CuratedLocaleTarget } from './ng-tag-build-locales/types.ts';
import {
  buildLocalizedXlf,
  parseTargets,
  parseTransUnits,
  type TranslationSeedMap
} from './xlf-localization.ts';

describe('xlf localization', () => {
  it('keeps inline placeholders in parsed sources and targets', () => {
    const legacyXlf = legacySeedXlf();

    expect(parseTransUnits(legacyXlf)).toEqual([
      {
        id: 'seeded',
        source:
          'Old source <x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i&gt;"/>text'
      },
      { id: 'curated', source: 'Legacy source' },
      { id: 'source-fallback', source: 'Kept <x id="INTERPOLATION"/> seed' }
    ]);
    expect(parseTargets(legacyXlf)).toEqual([
      {
        id: 'seeded',
        content:
          'Bonjour <x id="INTERPOLATION" equiv-text="{{name}}"/>' +
          '<x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i&gt;"/>'
      },
      { id: 'curated', content: 'Legacy target' }
    ]);
  });

  it('rewrites an existing target-language attribute', () => {
    const source = [
      '<?xml version="1.0" encoding="UTF-8" ?>',
      '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
      '  <file source-language="en-US" target-language="zh-Hant" datatype="plaintext" original="ng2.template">',
      '    <body>',
      '      <trans-unit id="title" datatype="html">',
      '        <source>Title</source>',
      '      </trans-unit>',
      '    </body>',
      '  </file>',
      '</xliff>',
      ''
    ].join('\n');
    const expected = [
      '<?xml version="1.0" encoding="UTF-8" ?>',
      '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
      '  <file source-language="en-US" target-language="zh-Hans" datatype="plaintext" original="ng2.template">',
      '    <body>',
      '      <trans-unit id="title" datatype="html">',
      '        <source>Title</source>',
      '        <target>Title</target>',
      '      </trans-unit>',
      '    </body>',
      '  </file>',
      '</xliff>',
      ''
    ].join('\n');

    expect(buildLocalizedXlf(source, localeTarget('zh-Hans'), new Map())).toBe(
      expected
    );
  });

  it('localizes a document from seeds, curated text, and copied sources', () => {
    const curated = `A & B <x id="INTERPOLATION"/> "q" 'z'`;
    const translations = applyLegacyAndCurated(legacySeedXlf(), {
      curated
    });

    expect(translations.get('seeded')).toEqual({
      content:
        'Bonjour <x id="INTERPOLATION" equiv-text="{{name}}"/>' +
        '<x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i&gt;"/>',
      isXmlFragment: true
    });
    expect(translations.get('curated')).toEqual({
      content: curated,
      isXmlFragment: false
    });
    expect(translations.get('source-fallback')).toEqual({
      content: 'Kept <x id="INTERPOLATION"/> seed',
      isXmlFragment: true
    });
    expect(translations.has('untouched')).toBe(false);

    const source = [
      '<?xml version="1.0" encoding="UTF-8" ?>',
      '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
      '  <file source-language="en-US" datatype="plaintext" original="ng2.template">',
      '    <body>',
      '      <trans-unit id="seeded" datatype="html">',
      '        <source>Hello <x id="INTERPOLATION" equiv-text="{{name}}"/></source>',
      '        <context-group purpose="location">',
      '          <context context-type="sourcefile">src/app.ts</context>',
      '          <context context-type="linenumber">4</context>',
      '        </context-group>',
      '      </trans-unit>',
      '      <trans-unit id="curated" datatype="html">',
      '        <source>Plain</source>',
      '        <target state="translated">stale</target>',
      '      </trans-unit>',
      '      <trans-unit id="source-fallback" datatype="html">',
      '        <source>New wording</source>',
      '      </trans-unit>',
      '      <trans-unit id="untouched" datatype="html">',
      '        <source>See <x id="PH" ctype="x-ph" equiv-text="ph"/> &amp; go</source>',
      '      </trans-unit>',
      '    </body>',
      '  </file>',
      '</xliff>',
      ''
    ].join('\n');
    const expected = [
      '<?xml version="1.0" encoding="UTF-8" ?>',
      '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
      '  <file source-language="en-US" datatype="plaintext" original="ng2.template" target-language="ja">',
      '    <body>',
      '      <trans-unit id="seeded" datatype="html">',
      '        <source>Hello <x id="INTERPOLATION" equiv-text="{{name}}"/></source>',
      '        <target>Bonjour <x id="INTERPOLATION" equiv-text="{{name}}"/><x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i&gt;"/></target>',
      '        <context-group purpose="location">',
      '          <context context-type="sourcefile">src/app.ts</context>',
      '          <context context-type="linenumber">4</context>',
      '        </context-group>',
      '      </trans-unit>',
      '      <trans-unit id="curated" datatype="html">',
      '        <source>Plain</source>',
      '        <target>A &amp; B &lt;x id=&quot;INTERPOLATION&quot;/&gt; &quot;q&quot; &apos;z&apos;</target>',
      '      </trans-unit>',
      '      <trans-unit id="source-fallback" datatype="html">',
      '        <source>New wording</source>',
      '        <target>Kept <x id="INTERPOLATION"/> seed</target>',
      '      </trans-unit>',
      '      <trans-unit id="untouched" datatype="html">',
      '        <source>See <x id="PH" ctype="x-ph" equiv-text="ph"/> &amp; go</source>',
      '        <target>See <x id="PH" ctype="x-ph" equiv-text="ph"/> &amp; go</target>',
      '      </trans-unit>',
      '    </body>',
      '  </file>',
      '</xliff>',
      ''
    ].join('\n');

    expect(buildLocalizedXlf(source, localeTarget('ja'), translations)).toBe(
      expected
    );
  });
});

function localeTarget(code: CuratedLocaleTarget['code']): CuratedLocaleTarget {
  return {
    code,
    file: `messages.${code}.xlf`,
    curatedTranslations: {} as CuratedLocaleTarget['curatedTranslations']
  };
}

// Same order as the converters: legacy source, then legacy target, then
// curated text.
function applyLegacyAndCurated(
  legacyXlf: string | null,
  curated: Readonly<Record<string, string>>
): TranslationSeedMap {
  const translations: TranslationSeedMap = new Map();

  if (legacyXlf) {
    for (const unit of parseTransUnits(legacyXlf)) {
      translations.set(unit.id, {
        content: unit.source,
        isXmlFragment: true
      });
    }

    for (const { id, content } of parseTargets(legacyXlf)) {
      translations.set(id, { content, isXmlFragment: true });
    }
  }

  for (const [id, content] of Object.entries(curated)) {
    translations.set(id, { content, isXmlFragment: false });
  }

  return translations;
}

function legacySeedXlf(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" ?>',
    '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
    '  <file source-language="en-US" datatype="plaintext" original="ng2.template" target-language="fr">',
    '    <body>',
    '      <trans-unit id="seeded" datatype="html">',
    '        <source>Old source <x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i&gt;"/>text</source>',
    '        <target>Bonjour <x id="INTERPOLATION" equiv-text="{{name}}"/><x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i&gt;"/></target>',
    '      </trans-unit>',
    '      <trans-unit id="curated" datatype="html">',
    '        <source>Legacy source</source>',
    '        <target>Legacy target</target>',
    '      </trans-unit>',
    '      <trans-unit id="source-fallback" datatype="html">',
    '        <source>Kept <x id="INTERPOLATION"/> seed</source>',
    '      </trans-unit>',
    '    </body>',
    '  </file>',
    '</xliff>',
    ''
  ].join('\n');
}
