import {
  type Params,
  type RedirectFunction,
  type Route
} from '@angular/router';
import {
  AboutComponent,
  DOCS_ROUTES,
  ObjectivesComponent,
  SUPPORTED_LOCALES
} from '@ui';
import { LandingPageComponent } from './lazy-pages/landing-page';

const DOCUMENTATION_ENTRY_PATH = 'documentation/introduction';

export const appRoutes: Route[] = [
  ...createProductDocRoutes(),
  ...SUPPORTED_LOCALES.map(({ urlSegment }) => ({
    path: urlSegment,
    children: createProductDocRoutes()
  })),
  {
    path: '**',
    redirectTo: ''
  }
];

function createProductDocRoutes(): Route[] {
  const redirectToDocumentationEntry = createDocumentationEntryRedirect();

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

/**
 * Legacy `/app` links land on the documentation entry. The target is relative
 * to the matched route, with no leading slash: an absolute path would drop a
 * locale prefix such as `/ja` and the localized build's base href. Query
 * params and the fragment are copied onto the target.
 */
function createDocumentationEntryRedirect(): RedirectFunction {
  return ({ fragment, queryParams }) => {
    return appendUrlState(DOCUMENTATION_ENTRY_PATH, queryParams, fragment);
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
