export const requiredCuratedIds = [
  'seo.landing.title',
  'seo.landing.description',
  'seo.about.title',
  'seo.about.description',
  'seo.objectives.title',
  'seo.objectives.description',
  'seo.app.title',
  'seo.app.description',
  'landing.hero.eyebrow',
  'landing.hero.title',
  'landing.hero.description',
  'landing.cta.primary',
  'landing.cta.secondary',
  'landing.proof.agency',
  'landing.proof.agency.detail',
  'landing.proof.ga4',
  'landing.proof.ga4.detail',
  'landing.proof.static',
  'landing.proof.static.detail',
  'landing.workflow.eyebrow',
  'landing.workflow.title',
  'landing.workflow.description',
  'landing.step.upload.title',
  'landing.step.upload.description',
  'landing.step.tune.title',
  'landing.step.tune.description',
  'landing.step.export.title',
  'landing.step.export.description',
  'landing.benefits.eyebrow',
  'landing.benefits.title',
  'landing.benefit.seo.title',
  'landing.benefit.seo.description',
  'landing.benefit.agency.title',
  'landing.benefit.agency.description',
  'landing.benefit.validation.title',
  'landing.benefit.validation.description',
  'landing.learn.eyebrow',
  'landing.learn.title',
  'landing.learn.description',
  'landing.link.about',
  'landing.link.objectives',
  'nav.app',
  'nav.about',
  'nav.objectives',
  'nav.github',
  'footerComponentLastUpdated'
] as const;

export type CuratedTranslationId = (typeof requiredCuratedIds)[number];

export type CuratedLocaleTranslations = Record<CuratedTranslationId, string>;

export interface CuratedLocaleTarget {
  readonly code: 'zh-Hant' | 'zh-Hans' | 'ja';
  readonly file: string;
  readonly curatedTranslations: CuratedLocaleTranslations;
}
