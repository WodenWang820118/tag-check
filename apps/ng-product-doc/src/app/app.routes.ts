import {
  type Params,
  type RedirectFunction,
  type Route
} from '@angular/router';
import {
  AboutComponent,
  DOCS_ROUTES,
  ObjectivesComponent,
  SUPPORTED_LOCALES,
  buildLocalizedPath
} from '@ui';
import { LandingPageComponent } from './lazy-pages/landing-page';

const DOCUMENTATION_ENTRY_PATH = 'documentation/introduction';

export const appRoutes: Route[] = [
  ...createProductDocRoutes(),
  ...SUPPORTED_LOCALES.map(({ urlSegment }) => ({
    path: urlSegment,
    children: createProductDocRoutes(urlSegment)
  })),
  {
    path: '**',
    redirectTo: ''
  }
];

function createProductDocRoutes(localeSegment?: string): Route[] {
  const redirectToDocumentationEntry =
    createDocumentationEntryRedirect(localeSegment);

  return [
    {
      path: '',
      pathMatch: 'full',
      component: LandingPageComponent,
      data: { seoKey: 'landing' }
    },
    {
      path: 'app',
      redirectTo: redirectToDocumentationEntry,
      pathMatch: 'full'
    },
    {
      path: 'app/**',
      redirectTo: redirectToDocumentationEntry
    },
    {
      path: 'documentation',
      children: DOCS_ROUTES,
      data: { seoKey: 'documentation' }
    },
    {
      path: 'about',
      component: AboutComponent,
      data: { seoKey: 'about' }
    },
    {
      path: 'objectives',
      component: ObjectivesComponent,
      data: { seoKey: 'objectives' }
    }
  ];
}

function createDocumentationEntryRedirect(
  localeSegment?: string
): RedirectFunction {
  return ({ fragment, queryParams }) => {
    const documentationEntryPath = localeSegment
      ? buildLocalizedPath(`/${DOCUMENTATION_ENTRY_PATH}`, localeSegment)
      : `/${DOCUMENTATION_ENTRY_PATH}`;

    return appendUrlState(documentationEntryPath, queryParams, fragment);
  };
}

function appendUrlState(
  path: string,
  queryParams: Params,
  fragment: string | null
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        appendSearchParam(searchParams, key, item);
      }
      continue;
    }

    appendSearchParam(searchParams, key, value);
  }

  const queryString = searchParams.toString();
  const fragmentSuffix = fragment ? `#${encodeURIComponent(fragment)}` : '';

  return `${path}${queryString ? `?${queryString}` : ''}${fragmentSuffix}`;
}

function appendSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: unknown
): void {
  if (value === null || value === undefined) {
    return;
  }

  searchParams.append(key, String(value));
}
