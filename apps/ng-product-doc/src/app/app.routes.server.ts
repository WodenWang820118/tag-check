import { RenderMode, type ServerRoute } from '@angular/ssr';
import { DOCUMENTATION_ROUTE_SLUGS } from '@ui';

const PRERENDER_PATHS = ['', 'about', 'objectives'] as const;
const CLIENT_ONLY_PATHS = ['app', 'app/**'] as const;
const DOCUMENTATION_PATH = 'documentation/:name';

export const serverRoutes: ServerRoute[] = [
  ...createServerRoutes(PRERENDER_PATHS, RenderMode.Prerender),
  createDocumentationServerRoute(),
  ...createServerRoutes(CLIENT_ONLY_PATHS, RenderMode.Client),
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];

function createDocumentationServerRoute(): ServerRoute {
  return {
    path: DOCUMENTATION_PATH,
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return DOCUMENTATION_ROUTE_SLUGS.map((name) => ({ name }));
    }
  };
}

function createServerRoutes(
  paths: readonly string[],
  renderMode: RenderMode.Prerender
): ServerRoute[];
function createServerRoutes(
  paths: readonly string[],
  renderMode: RenderMode.Client
): ServerRoute[];
function createServerRoutes(
  paths: readonly string[],
  renderMode: RenderMode.Prerender | RenderMode.Client
): ServerRoute[] {
  if (renderMode === RenderMode.Prerender) {
    return paths.map((path) => ({
      path,
      renderMode: RenderMode.Prerender
    }));
  }

  return paths.map((path) => ({
    path,
    renderMode: RenderMode.Client
  }));
}
