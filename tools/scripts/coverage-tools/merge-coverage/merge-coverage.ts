import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

import { glob } from 'glob';

import { isMainModule } from '../../shared/entrypoint/entrypoint.ts';

export const DEFAULT_OUTPUT_PATH = 'coverage/lcov.info';
export const BACKEND_E2E_COVERAGE_GLOB = 'coverage/apps/nest-backend-e2e/**';

export interface MergeCoverageOptions {
  cwd?: string;
  includeE2eCoverage?: boolean;
  outputPath?: string;
}

export interface MergeCoverageResult {
  files: string[];
  includeE2eCoverage: boolean;
  outputPath: string;
  reportLength: number;
}

export function shouldIncludeE2eCoverage(
  value = process.env.INCLUDE_E2E_COVERAGE
): boolean {
  return value === '1';
}

export async function findLcovFiles(
  options: MergeCoverageOptions = {}
): Promise<string[]> {
  const includeE2eCoverage =
    options.includeE2eCoverage ?? shouldIncludeE2eCoverage();
  const outputPath = normalizeCoveragePath(
    options.outputPath ?? DEFAULT_OUTPUT_PATH
  );
  const ignore = [
    outputPath,
    'node_modules/**',
    ...(includeE2eCoverage ? [] : [BACKEND_E2E_COVERAGE_GLOB])
  ];

  const files = await glob('coverage/**/lcov.info', {
    cwd: resolve(options.cwd ?? process.cwd()),
    ignore,
    nodir: true,
    windowsPathsNoEscape: true
  });

  return files
    .map(normalizeCoveragePath)
    .sort((left, right) => left.localeCompare(right));
}

/**
 * The project roots an LCOV file's paths may be relative to: its directory
 * under coverage/ (coverage/libs/utils → libs/utils), and for an e2e project
 * the project it tests (apps/nest-backend-e2e → apps/nest-backend).
 */
function projectRootsFor(lcovFile: string): string[] {
  const root = normalizeCoveragePath(relative('coverage', dirname(lcovFile)));
  const tested = root.replace(/-e2e$/u, '');
  return tested === root ? [root] : [root, tested];
}

/**
 * Rewrites an LCOV file's source paths to be relative to the workspace root.
 * Vitest writes them relative to the project it ran in (src/lib/a.ts), which
 * SonarCloud cannot place: several libraries have a src/lib folder. A path
 * that already exists from the workspace root is kept.
 */
export function rebaseLcovPaths(
  content: string,
  lcovFile: string,
  cwd = process.cwd()
): string {
  const roots = projectRootsFor(lcovFile);
  return content.replace(/^SF:(.+)$/gmu, (_line, rawPath: string) => {
    const path = rawPath.trim().replaceAll('\\', '/');
    const fromWorkspace = isAbsolute(path)
      ? normalizeCoveragePath(relative(cwd, path))
      : path;
    if (existsSync(resolve(cwd, fromWorkspace))) {
      return `SF:${fromWorkspace}`;
    }
    const root = roots.find((candidate) =>
      existsSync(resolve(cwd, candidate, fromWorkspace))
    );
    return `SF:${root ? `${root}/${fromWorkspace}` : fromWorkspace}`;
  });
}

export function mergeLcovContents(
  files: string[],
  cwd = process.cwd()
): string {
  const sections = files
    .map((file) =>
      rebaseLcovPaths(
        readFileSync(resolve(cwd, file), 'utf8').replace(/[\r\n]+$/u, ''),
        file,
        cwd
      )
    )
    .filter((content) => content.length > 0);

  return sections.length > 0 ? `${sections.join('\n')}\n` : '';
}

export async function mergeCoverage(
  options: MergeCoverageOptions = {}
): Promise<MergeCoverageResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const includeE2eCoverage =
    options.includeE2eCoverage ?? shouldIncludeE2eCoverage();
  const outputPath = normalizeCoveragePath(
    options.outputPath ?? DEFAULT_OUTPUT_PATH
  );
  const files = await findLcovFiles({
    cwd,
    includeE2eCoverage,
    outputPath
  });

  if (files.length === 0) {
    throw new Error('No LCOV files found under coverage/**/lcov.info.');
  }

  const mergedReport = mergeLcovContents(files, cwd);
  if (!mergedReport) {
    throw new Error('LCOV files were found, but all of them were empty.');
  }

  const resolvedOutputPath = resolve(cwd, outputPath);
  mkdirSync(dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, mergedReport, 'utf8');

  return {
    files,
    includeE2eCoverage,
    outputPath,
    reportLength: mergedReport.length
  };
}

async function main(): Promise<void> {
  const result = await mergeCoverage();

  console.log(`Include e2e coverage: ${result.includeE2eCoverage}`);
  console.log(`Merged ${result.files.length} LCOV file(s):`);
  for (const file of result.files) {
    console.log(`- ${file}`);
  }
  console.log(`Merged coverage report written to ${result.outputPath}`);
}

function normalizeCoveragePath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//u, '');
}

if (isMainModule(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
