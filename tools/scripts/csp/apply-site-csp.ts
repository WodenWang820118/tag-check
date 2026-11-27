import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { join, resolve } from 'node:path';

import { isDirectEntrypoint } from '../shared/paths.ts';
import { applyPolicyToHtml, inlineScriptHashes } from './build-policy.ts';
import { SITE_POLICIES, type SiteName } from './site-policies.ts';

interface CliArgs {
  readonly site: SiteName;
  readonly dir: string;
}

function isKnownSite(value: string): value is SiteName {
  return Object.hasOwn(SITE_POLICIES, value);
}

function parseCliArgs(argv: readonly string[]): CliArgs {
  let site: string | undefined;
  let dir: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--site') {
      site = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--site=')) {
      site = arg.slice('--site='.length);
    } else if (arg === '--dir') {
      dir = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--dir=')) {
      dir = arg.slice('--dir='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!site) {
    throw new Error('Missing required --site <name> argument.');
  }
  if (!isKnownSite(site)) {
    throw new Error(
      `Unknown site "${site}". Known sites: ${Object.keys(SITE_POLICIES).join(', ')}`
    );
  }
  if (!dir) {
    throw new Error('Missing required --dir <directory> argument.');
  }

  return { site, dir: resolve(dir) };
}

function collectHtmlFiles(directory: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

function main(argv: readonly string[]): void {
  const { site, dir } = parseCliArgs(argv);

  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`Built browser directory does not exist: ${dir}`);
  }

  const htmlFiles = collectHtmlFiles(dir);
  if (htmlFiles.length === 0) {
    throw new Error(`No HTML files found in ${dir}`);
  }

  const policy = SITE_POLICIES[site];
  const distinctHashes = new Set<string>();

  for (const filePath of htmlFiles) {
    const original = readFileSync(filePath, 'utf8');
    if (policy.hashInlineScripts) {
      for (const hash of inlineScriptHashes(original)) {
        distinctHashes.add(hash);
      }
    }

    const updated = applyPolicyToHtml(original, policy, filePath);
    if (updated !== original) {
      writeFileSync(filePath, updated, 'utf8');
    }
  }

  console.log(
    `Applied CSP for ${site}: ${htmlFiles.length} pages, ${distinctHashes.size} distinct inline-script hashes`
  );
}

if (isDirectEntrypoint(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
