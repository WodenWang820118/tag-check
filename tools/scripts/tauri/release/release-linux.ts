import { isDirectEntrypoint } from '../../shared/paths.ts';

import { runPlatformRelease } from './release.ts';

export async function main() {
  await runPlatformRelease('linux');
}

if (isDirectEntrypoint(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
