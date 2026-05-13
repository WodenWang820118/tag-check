import { RenderMode, type ServerRoute } from '@angular/ssr';
import { DOCUMENTATION_ROUTE_SLUGS, SUPPORTED_LOCALES } from '@ui';

const PRERENDER_PATHS = ['', 'about', 'objectives'] as const;
const CLIENT_ONLY_PATHS = ['app', 'app/**'] as const;
const DOCUMENTATION_PATH = 'documentation/:name';

export const serverRoutes: ServerRoute[] = [
  ...createServerRoutes(PRERENDER_PATHS, RenderMode.Prerender),
  createDocumentationServerRoute(),
  ...createServerRoutes(CLIENT_ONLY_PATHS, RenderMode.Client),
  ...SUPPORTED_LOCALES.flatMap(({ urlSegment }) => [
    ...createServerRoutes(PRERENDER_PATHS, RenderMode.Prerender, urlSegment),
    createDocumentationServerRoute(urlSegment),
    ...createServerRoutes(CLIENT_ONLY_PATHS, RenderMode.Client, urlSegment)
  ]),
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];

function createDocumentationServerRoute(localeSegment?: string): ServerRoute {
  return {
    path: joinRoutePath(DOCUMENTATION_PATH, localeSegment),
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return DOCUMENTATION_ROUTE_SLUGS.map((name) => ({ name }));
    }
  };
}

function createServerRoutes(
  paths: readonly string[],
  renderMode: RenderMode.Prerender,
  localeSegment?: string
): ServerRoute[];
function createServerRoutes(
  paths: readonly string[],
  renderMode: RenderMode.Client,
  localeSegment?: string
): ServerRoute[];
function createServerRoutes(
  paths: readonly string[],
  renderMode: RenderMode.Prerender | RenderMode.Client,
  localeSegment?: string
): ServerRoute[] {
  if (renderMode === RenderMode.Prerender) {
    return paths.map((path) => ({
      path: joinRoutePath(path, localeSegment),
      renderMode: RenderMode.Prerender
    }));
  }

  return paths.map((path) => ({
    path: joinRoutePath(path, localeSegment),
    renderMode: RenderMode.Client
  }));
}

function joinRoutePath(path: string, localeSegment?: string): string {
  if (!localeSegment) {
    return path;
  }

  return path ? `${localeSegment}/${path}` : localeSegment;
}
