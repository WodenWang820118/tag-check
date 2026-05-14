import { RenderMode, type ServerRoute } from '@angular/ssr';
import { SUPPORTED_LOCALES } from '@ui';

const PRERENDER_PATHS = ['', 'about', 'objectives'] as const;
const CLIENT_ONLY_PATHS = ['app'] as const;

export const serverRoutes: ServerRoute[] = [
  ...createServerRoutes(PRERENDER_PATHS, RenderMode.Prerender),
  ...createServerRoutes(CLIENT_ONLY_PATHS, RenderMode.Client),
  ...SUPPORTED_LOCALES.flatMap(({ urlSegment }) => [
    ...createServerRoutes(PRERENDER_PATHS, RenderMode.Prerender, urlSegment),
    ...createServerRoutes(CLIENT_ONLY_PATHS, RenderMode.Client, urlSegment)
  ]),
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];

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
  renderMode: RenderMode.Client | RenderMode.Prerender,
  localeSegment?: string
): ServerRoute[] {
  const routePaths = paths.map((path) =>
    localeSegment ? joinRoutePath(localeSegment, path) : path
  );

  if (renderMode === RenderMode.Prerender) {
    return routePaths.map((path) => ({
      path,
      renderMode: RenderMode.Prerender
    }));
  }

  return routePaths.map((path) => ({
    path,
    renderMode: RenderMode.Client
  }));
}

function joinRoutePath(localeSegment: string, path: string): string {
  return path ? `${localeSegment}/${path}` : localeSegment;
}
