import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function isMainModule(
  moduleUrl: string,
  argv: ReadonlyArray<string | undefined> = process.argv
): boolean {
  const entrypoint = argv[1];
  if (!entrypoint) {
    return false;
  }

  return moduleUrl === pathToFileURL(resolve(entrypoint)).href;
}
