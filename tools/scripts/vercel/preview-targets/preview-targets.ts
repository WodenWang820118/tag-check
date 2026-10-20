import { readFileSync } from 'node:fs';

import { isMainModule } from '../../shared/entrypoint/entrypoint.ts';

/**
 * A Vercel site deployed from this repository.
 *
 * Vercel's Git integration deploys only `main` (see `vercel.json`). The
 * Vercel previews workflow deploys a preview of a site when a pull request
 * affects the Nx project the site is built from.
 */
export interface PreviewTarget {
  /** Nx project the site is built from. */
  nxProject: string;
  /** Vercel project name. */
  vercelProject: string;
  /** Root `package.json` script set as the Vercel project's Build Command. */
  buildScript: string;
}

export const PREVIEW_TARGETS: readonly PreviewTarget[] = [
  {
    nxProject: 'ng-gtm-sample',
    vercelProject: 'tag-check-ng-gtm-sample',
    buildScript: 'build-ng-sample-site'
  },
  {
    nxProject: 'ng-tag-build',
    vercelProject: 'tag-build',
    buildScript: 'build-tag-build'
  },
  {
    nxProject: 'ng-product-doc',
    vercelProject: 'tag-check-documentation',
    buildScript: 'build-product-doc'
  },
  {
    nxProject: 'ng-frontend',
    vercelProject: 'tag-check-storybook',
    buildScript: 'build-storybook'
  }
];

/** Reads the project list `nx show projects --json` prints. */
export function parseAffectedProjects(output: string): string[] {
  // Nx can print plugin warnings before the JSON, so read the last array line.
  const line = output
    .split(/\r?\n/)
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.startsWith('['))
    .at(-1);
  if (line === undefined) {
    throw new Error(
      'Expected the JSON array that `nx show projects --json` prints.'
    );
  }

  const parsed: unknown = JSON.parse(line);
  if (
    !Array.isArray(parsed) ||
    !parsed.every((name) => typeof name === 'string')
  ) {
    throw new Error(
      'Expected `nx show projects --json` to print an array of project names.'
    );
  }

  return parsed;
}

export function selectPreviewTargets(
  affectedProjects: readonly string[]
): PreviewTarget[] {
  const affected = new Set(affectedProjects);
  return PREVIEW_TARGETS.filter((target) => affected.has(target.nxProject));
}

/** Prints `targets=<json>` for `$GITHUB_OUTPUT`, used as the deploy job's matrix. */
function main(): void {
  const [affectedFile] = process.argv.slice(2);
  if (!affectedFile) {
    throw new Error(
      'Usage: node preview-targets.ts <nx-affected-projects.json>'
    );
  }

  const targets = selectPreviewTargets(
    parseAffectedProjects(readFileSync(affectedFile, 'utf8'))
  );
  const names =
    targets.map((target) => target.vercelProject).join(', ') || 'none';
  console.error(`Vercel previews: ${names}`);
  console.log(`targets=${JSON.stringify(targets)}`);
}

if (isMainModule(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
