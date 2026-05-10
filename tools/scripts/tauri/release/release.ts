import { writeFileSync } from 'node:fs';

import {
  getShellSafePackageManagerCommand,
  runSyncCommandOrThrow
} from '../../shared/process.ts';
import { isDirectEntrypoint } from '../../shared/paths.ts';
import { workspaceRoot } from '../path-contract/path-contract.ts';
import {
  assembleReleaseAssets,
  validateReleaseArtifact,
  bundleReleaseArtifact as bundleReleaseArtifactForPlatform
} from './release-assets.ts';
import {
  assertVersionAuthoritiesInSync,
  buildArtifactName,
  buildAssetFileName,
  buildStableReleaseTag,
  downloadedReleaseAssetsRoot,
  parseStableReleaseTag,
  publishReleaseRoot,
  resolveReleasePlatform,
  type ReleasePlatform
} from './release-contract.ts';

export {
  assertVersionAuthoritiesInSync,
  buildArtifactName,
  buildAssetFileName,
  buildStableReleaseTag,
  createChecksumFileContents,
  parseStableReleaseTag,
  readVersionAuthorities,
  releaseArtifactDefinitions,
  resolveReleasePlatform,
  type ReleaseArtifactDefinition,
  type ReleaseManifest,
  type ReleasePlatform,
  type VersionAuthorities
} from './release-contract.ts';
export {
  assembleReleaseAssets,
  buildBundleCommandArgs,
  buildTauriBundleCommand,
  pruneLinuxAppImageBackendPrebuilds,
  validateReleaseArtifact,
  type ReleaseArtifactValidationResult,
  type TauriBundleCommand
} from './release-assets.ts';

const prepareRuntimeCommandArgs = [
  'nx',
  'run',
  'desktop-tauri:prepare-runtime'
];

function getArgumentValue(flag: string, args: string[]) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];

  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

function appendGithubOutput(entries: Record<string, string>) {
  const githubOutputPath = process.env.GITHUB_OUTPUT;

  if (!githubOutputPath) {
    return;
  }

  const lines = Object.entries(entries).map(
    ([key, value]) => `${key}=${value}`
  );
  writeFileSync(githubOutputPath, `${lines.join('\n')}\n`, {
    encoding: 'utf8',
    flag: 'a'
  });
}

async function describeRelease(args: string[]) {
  const platformInput = getArgumentValue('--platform', args);
  const requestedReleaseTag = getArgumentValue('--release-tag', args);
  const expectedVersion = requestedReleaseTag
    ? parseStableReleaseTag(requestedReleaseTag)
    : undefined;
  const version = assertVersionAuthoritiesInSync(expectedVersion);
  const releaseTag = buildStableReleaseTag(version);
  const platform = platformInput
    ? resolveReleasePlatform(platformInput)
    : undefined;
  const result = {
    assetFileName: platform ? buildAssetFileName(version, platform) : '',
    artifactName: platform ? buildArtifactName(version, platform) : '',
    platform: platform ?? '',
    releaseTag,
    version
  };

  appendGithubOutput({
    asset_file_name: result.assetFileName,
    artifact_name: result.artifactName,
    platform: result.platform,
    release_tag: result.releaseTag,
    release_version: result.version
  });
  console.log(JSON.stringify(result, null, 2));
}

export async function runPlatformRelease(platform: ReleasePlatform) {
  const packageManagerCommand = getShellSafePackageManagerCommand('pnpm');

  runSyncCommandOrThrow({
    args: prepareRuntimeCommandArgs,
    command: packageManagerCommand.command,
    cwd: workspaceRoot,
    shell: packageManagerCommand.shell,
    stdio: 'inherit'
  });

  const version = assertVersionAuthoritiesInSync();
  const { assetPath, manifestPath } = await bundleReleaseArtifactForPlatform(
    platform,
    version
  );
  console.log(
    `Prepared ${platform} desktop release asset ${assetPath} and manifest ${manifestPath}.`
  );
}

async function validateReleaseArtifactCommand(args: string[]) {
  const platform = resolveReleasePlatform(getArgumentValue('--platform', args));
  const releaseTag = getArgumentValue('--release-tag', args);

  if (!releaseTag) {
    throw new Error('validate-artifact requires --release-tag <stable-tag>.');
  }

  const expectedVersion = parseStableReleaseTag(releaseTag);
  assertVersionAuthoritiesInSync(expectedVersion);
  const result = await validateReleaseArtifact(platform, expectedVersion);
  console.log(JSON.stringify(result, null, 2));
}

async function bundleRelease(args: string[]) {
  const platform = resolveReleasePlatform(getArgumentValue('--platform', args));
  await runPlatformRelease(platform);
}

async function assembleRelease(args: string[]) {
  const artifactsRoot =
    getArgumentValue('--artifacts-root', args) ?? downloadedReleaseAssetsRoot;
  const outputDirectory =
    getArgumentValue('--output-dir', args) ?? publishReleaseRoot;
  const releaseTag = getArgumentValue('--release-tag', args);

  if (!releaseTag) {
    throw new Error('assemble requires --release-tag <stable-tag>.');
  }

  const expectedVersion = parseStableReleaseTag(releaseTag);
  assertVersionAuthoritiesInSync(expectedVersion);
  const manifests = await assembleReleaseAssets(
    artifactsRoot,
    outputDirectory,
    expectedVersion,
    appendGithubOutput
  );

  console.log(
    `Assembled ${manifests.length} release assets and SHA256SUMS.txt in ${outputDirectory}.`
  );
}

export async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'assemble':
      await assembleRelease(args);
      break;
    case 'bundle':
      await bundleRelease(args);
      break;
    case 'describe':
      await describeRelease(args);
      break;
    case 'validate-artifact':
      await validateReleaseArtifactCommand(args);
      break;
    default:
      throw new Error(
        'Expected one of: describe, bundle, assemble, validate-artifact.'
      );
  }
}

if (isDirectEntrypoint(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
