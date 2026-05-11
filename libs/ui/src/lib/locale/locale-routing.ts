export type SupportedLocaleCode = 'en-US' | 'zh-Hant' | 'zh-Hans' | 'ja';
export type LocaleUrlSegment = '' | 'zh-hant' | 'zh-hans' | 'ja';
export type LocaleAssetSegment = 'en' | 'zh-hant' | 'zh-hans' | 'ja';
export type LocaleHreflang = 'en' | 'zh-Hant' | 'zh-Hans' | 'ja';

export interface SupportedLocale {
  readonly code: SupportedLocaleCode;
  readonly urlSegment: LocaleUrlSegment;
  readonly assetSegment: LocaleAssetSegment;
  readonly hreflang: LocaleHreflang;
  readonly label: string;
}

export const SUPPORTED_LOCALES = [
  {
    code: 'en-US',
    urlSegment: '',
    assetSegment: 'en',
    hreflang: 'en',
    label: 'English'
  },
  {
    code: 'zh-Hant',
    urlSegment: 'zh-hant',
    assetSegment: 'zh-hant',
    hreflang: 'zh-Hant',
    label: 'Traditional Chinese'
  },
  {
    code: 'zh-Hans',
    urlSegment: 'zh-hans',
    assetSegment: 'zh-hans',
    hreflang: 'zh-Hans',
    label: 'Simplified Chinese'
  },
  {
    code: 'ja',
    urlSegment: 'ja',
    assetSegment: 'ja',
    hreflang: 'ja',
    label: 'Japanese'
  }
] as const satisfies readonly SupportedLocale[];

export const DEFAULT_LOCALE = SUPPORTED_LOCALES[0];
export const INDEXABLE_LOGICAL_ROUTES = ['/', '/about', '/objectives'] as const;
export const APP_LOGICAL_ROUTE = '/app' as const;

export function getLocaleConfig(
  locale: string | null | undefined
): SupportedLocale {
  const normalized = normalizeLocale(locale);
  return (
    SUPPORTED_LOCALES.find((supportedLocale) =>
      isLocaleMatch(supportedLocale, normalized)
    ) ?? DEFAULT_LOCALE
  );
}

export function stripLocalePrefix(pathname: string): string {
  const normalizedPath = normalizePath(pathname);
  const segments = normalizedPath.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  const locale = SUPPORTED_LOCALES.find(
    (supportedLocale) => supportedLocale.urlSegment === firstSegment
  );

  if (!locale?.urlSegment) {
    return normalizedPath;
  }

  const remainingSegments = segments.slice(1);
  return remainingSegments.length === 0
    ? '/'
    : `/${remainingSegments.join('/')}`;
}

export function buildLocalizedPath(
  logicalPath: string,
  locale: string | SupportedLocale
): string {
  const localeConfig =
    typeof locale === 'string' ? getLocaleConfig(locale) : locale;
  const normalizedPath = stripLocalePrefix(logicalPath);

  if (!localeConfig.urlSegment) {
    return normalizedPath;
  }

  return normalizedPath === '/'
    ? `/${localeConfig.urlSegment}/`
    : `/${localeConfig.urlSegment}${normalizedPath}`;
}

export function getLogicalPath(pathname: string): string {
  return stripLocalePrefix(pathname);
}

export function isIndexableLogicalRoute(pathname: string): boolean {
  const logicalPath = stripLocalePrefix(pathname);
  return INDEXABLE_LOGICAL_ROUTES.some((route) => route === logicalPath);
}

function normalizeLocale(locale: string | null | undefined): string {
  return (locale ?? DEFAULT_LOCALE.code).replace(/_/g, '-').toLowerCase();
}

function isLocaleMatch(
  supportedLocale: SupportedLocale,
  normalizedLocale: string
): boolean {
  const normalizedCode = normalizeLocale(supportedLocale.code);
  const normalizedHrefLang = supportedLocale.hreflang.toLowerCase();

  return (
    normalizedCode === normalizedLocale ||
    supportedLocale.urlSegment === normalizedLocale ||
    normalizedHrefLang === normalizedLocale ||
    normalizedLocale.startsWith(`${normalizedCode}-`) ||
    normalizedLocale.startsWith(`${normalizedHrefLang}-`)
  );
}

function normalizePath(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/)[0] || '/';
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/+$/, '')
    : withLeadingSlash;
}
