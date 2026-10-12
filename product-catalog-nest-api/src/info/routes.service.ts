import { Injectable, RequestMethod } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';

export interface RouteInfo {
  method: string;
  path: string;
}

// Metadata keys Nest stores on controllers and handlers (@Controller(path), @Get(path), ...)
const PATH_METADATA = 'path';
const METHOD_METADATA = 'method';
const METHOD_ORDER = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function joinPaths(...parts: string[]): string {
  const joined = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return '/' + joined;
}

/** Lists every route of the app by reading the controllers' decorator metadata. */
@Injectable()
export class RoutesService {
  private cache?: RouteInfo[];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  list(): RouteInfo[] {
    if (this.cache) return this.cache;
    const routes: RouteInfo[] = [];

    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;
      const controllerPaths = ([] as string[]).concat(
        Reflect.getMetadata(PATH_METADATA, metatype) ?? '/',
      );
      const prototype = Object.getPrototypeOf(instance);

      for (const name of this.scanner.getAllMethodNames(prototype)) {
        const handler = prototype[name];
        const methodPaths = Reflect.getMetadata(PATH_METADATA, handler);
        const method = Reflect.getMetadata(METHOD_METADATA, handler);
        if (methodPaths === undefined || method === undefined) continue;

        for (const base of controllerPaths) {
          for (const p of ([] as string[]).concat(methodPaths)) {
            routes.push({
              method: RequestMethod[method],
              path: joinPaths(base, p),
            });
          }
        }
      }
    }

    const base = (p: string) => p.replace(/\/:.*$/, '');
    this.cache = routes.sort(
      (a, b) =>
        base(a.path).localeCompare(base(b.path)) ||
        a.path.length - b.path.length ||
        METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method),
    );
    return this.cache;
  }
}
