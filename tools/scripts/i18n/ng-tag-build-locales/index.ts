import { jaCuratedTranslations } from './ja.ts';
import { zhHansCuratedTranslations } from './zh-hans.ts';
import { zhHantCuratedTranslations } from './zh-hant.ts';
import type { CuratedLocaleTarget } from './types.ts';

export { requiredCuratedIds } from './types.ts';

export const localeTargets = [
  {
    code: 'zh-Hant',
    file: 'messages.zh-hant.xlf',
    curatedTranslations: zhHantCuratedTranslations
  },
  {
    code: 'zh-Hans',
    file: 'messages.zh-hans.xlf',
    curatedTranslations: zhHansCuratedTranslations
  },
  {
    code: 'ja',
    file: 'messages.ja.xlf',
    curatedTranslations: jaCuratedTranslations
  }
] satisfies readonly CuratedLocaleTarget[];
