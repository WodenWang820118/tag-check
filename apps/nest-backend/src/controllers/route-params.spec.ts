import 'reflect-metadata';
import {
  MODULE_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { describe, expect, it } from 'vitest';
import { ControllerModule } from './controller.module';

type Controller = new (...args: never[]) => object;
type RouteArg = { index: number; data?: unknown };

/** The `:name` segments of a controller path and a route path. */
function routeParams(...paths: unknown[]): Set<string> {
  const names = paths
    .flatMap((path) => (Array.isArray(path) ? path : [path]))
    .filter((path): path is string => typeof path === 'string')
    .flatMap((path) => [...path.matchAll(/:(\w+)/g)].map((match) => match[1]));
  return new Set(names);
}

/** The names a handler reads with `@Param('name')`. */
function paramNames(controller: Controller, method: string): string[] {
  const args: Record<string, RouteArg> =
    Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, method) ?? {};
  return Object.entries(args)
    .filter(([key]) => key.startsWith(`${RouteParamtypes.PARAM}:`))
    .map(([, arg]) => arg.data)
    .filter((data): data is string => typeof data === 'string');
}

describe('controller routes', () => {
  const controllers: Controller[] =
    Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, ControllerModule) ?? [];

  it('lists the controllers', () => {
    expect(controllers.length).toBeGreaterThan(0);
  });

  it.each(controllers.map((controller) => [controller.name, controller]))(
    '%s declares every @Param it reads in its route',
    (_name, controller) => {
      const prototype = controller.prototype as Record<string, unknown>;
      const missing = Object.getOwnPropertyNames(prototype).flatMap(
        (method) => {
          const handler = prototype[method];
          if (typeof handler !== 'function') return [];
          const routePath = Reflect.getMetadata(PATH_METADATA, handler);
          if (routePath === undefined) return [];
          const declared = routeParams(
            Reflect.getMetadata(PATH_METADATA, controller),
            routePath
          );
          return paramNames(controller, method)
            .filter((name) => !declared.has(name))
            .map((name) => `${method}: ${name}`);
        }
      );
      expect(missing).toEqual([]);
    }
  );
});
