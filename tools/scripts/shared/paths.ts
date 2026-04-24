import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function resolveWorkspaceRootFromModuleUrl(
  moduleUrl: string,
  levelsFromModuleFile: number
): string {
  return resolve(
    fileURLToPath(new URL(`${'../'.repeat(levelsFromModuleFile)}`, moduleUrl))
  );
}

export function normalizeToolPath(candidate: string): string {
  return candidate.replaceAll('\\', '/').replace(/^\.\//, '').trim();
}

export function isDirectEntrypoint(
  moduleUrl: string,
  argv: ReadonlyArray<string | undefined> = process.argv
): boolean {
  const entrypoint = argv[1];
  if (!entrypoint) {
    return false;
  }

  return moduleUrl === pathToFileURL(resolve(entrypoint)).href;
}
