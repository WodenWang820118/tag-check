/** Angular locale IDs the sites are built for. */
export type SupportedLocaleCode = 'en-US' | 'zh-Hant' | 'zh-Hans' | 'ja';
export type LocaleUrlSegment = 'en' | 'zh-hant' | 'zh-hans' | 'ja';
export type LocaleAssetSegment = 'en' | 'zh-hant' | 'zh-hans' | 'ja';
export type LocaleHreflang = 'en' | 'zh-Hant' | 'zh-Hans' | 'ja';

/**
 * One built locale: its Angular locale ID, its URL prefix, the folder of its
 * markdown assets and its hreflang value.
 */
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
    urlSegment: 'en',
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

/** English, used when a locale or URL prefix is not supported. */
export const DEFAULT_LOCALE = SUPPORTED_LOCALES[0];
/** Routes that search engines may index, without their locale prefix. */
export const INDEXABLE_LOGICAL_ROUTES = ['/', '/about', '/objectives'] as const;

/**
 * The supported locale for an Angular locale ID, URL prefix or hreflang,
 * matched case-insensitively with `_` read as `-`; a regional variant such as
 * `ja-JP` matches its language. Falls back to {@link DEFAULT_LOCALE}.
 */
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

/**
 * The logical route of a pathname: without query, fragment, trailing slashes
 * and a leading supported locale prefix. `/ja/` becomes `/`.
 */
export function stripLocalePrefix(pathname: string): string {
  const normalizedPath = normalizePath(pathname);
  const segments = normalizedPath.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  const locale = findLocaleByUrlSegment(firstSegment);

  if (!locale) {
    return normalizedPath;
  }

  const remainingSegments = segments.slice(1);
  return remainingSegments.length === 0
    ? '/'
    : `/${remainingSegments.join('/')}`;
}

/**
 * The pathname of a logical route in a locale. Every locale, English
 * included, gets its prefix; the root keeps a trailing slash (`/en/`).
 */
export function buildLocalizedPath(
  logicalPath: string,
  locale: string | SupportedLocale
): string {
  const localeConfig =
    typeof locale === 'string' ? getLocaleConfig(locale) : locale;
  const normalizedPath = stripLocalePrefix(logicalPath);

  return normalizedPath === '/'
    ? `/${localeConfig.urlSegment}/`
    : `/${localeConfig.urlSegment}${normalizedPath}`;
}

/** The locale a pathname's prefix names, or {@link DEFAULT_LOCALE}. */
export function getLocaleFromPathname(pathname: string): SupportedLocale {
  const normalizedPath = normalizePath(pathname);
  const firstSegment = normalizedPath
    .split('/')
    .filter(Boolean)[0]
    ?.toLowerCase();

  return findLocaleByUrlSegment(firstSegment) ?? DEFAULT_LOCALE;
}

/**
 * Whether search engines may index the page: the landing, about and
 * objectives pages and each documentation page, in any locale.
 */
export function isIndexableLogicalRoute(pathname: string): boolean {
  const logicalPath = stripLocalePrefix(pathname);
  if (INDEXABLE_LOGICAL_ROUTES.some((route) => route === logicalPath)) {
    return true;
  }

  return /^\/documentation\/[^/]+$/.test(logicalPath);
}

function normalizeLocale(locale: string | null | undefined): string {
  return (locale ?? DEFAULT_LOCALE.code).replaceAll('_', '-').toLowerCase();
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

function findLocaleByUrlSegment(
  urlSegment: string | undefined
): SupportedLocale | undefined {
  if (!urlSegment) {
    return undefined;
  }

  return SUPPORTED_LOCALES.find(
    (supportedLocale) => supportedLocale.urlSegment === urlSegment
  );
}

/**
 * Drops the query and fragment, adds a leading slash and removes trailing
 * ones, keeping `/` for the root (`'//'` included).
 */
function normalizePath(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/)[0] || '/';
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  let end = withLeadingSlash.length;
  while (end > 1 && withLeadingSlash[end - 1] === '/') {
    end--;
  }
  return withLeadingSlash.slice(0, end);
}
