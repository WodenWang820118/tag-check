import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { basename, dirname, join } from 'node:path';

import archiver from 'archiver';

import { getPnpmCommand, runSyncCommandOrThrow } from '../../shared/process.ts';
import { isDirectEntrypoint } from '../../shared/paths.ts';
import { getRustTargetTriple } from '../node-sidecar/node-sidecar.ts';
import { workspaceRoot } from '../path-contract/path-contract.ts';

export type ReleasePlatform = 'windows' | 'macos' | 'linux';

export interface ReleaseArtifactDefinition {
  assetExtension: '.AppImage' | '.exe' | '.tar.gz';
  artifactSuffix: string;
  bundleTarget: 'app' | 'appimage' | 'nsis';
  hostArch: NodeJS.Architecture;
  hostPlatform: NodeJS.Platform;
  rawBundleDirectory: string;
  rawBundleMatcher: (
    candidatePath: string,
    stats: ReturnType<typeof statSync>
  ) => boolean;
  rustTargetTriple: string;
}

export interface VersionAuthorities {
  cargoManifest: string;
  packageJson: string;
  tauriConfig: string;
}

export interface ReleaseManifest {
  artifactName: string;
  assetFileName: string;
  bundleTarget: ReleaseArtifactDefinition['bundleTarget'];
  generatedAt: string;
  platform: ReleasePlatform;
  rustTargetTriple: string;
  sha256: string;
  version: string;
}

export const releaseArtifactDefinitions: Record<
  ReleasePlatform,
  ReleaseArtifactDefinition
> = {
  windows: {
    assetExtension: '.exe',
    artifactSuffix: 'windows-x64-nsis',
    bundleTarget: 'nsis',
    hostArch: 'x64',
    hostPlatform: 'win32',
    rawBundleDirectory: join(
      workspaceRoot,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'target',
      'release',
      'bundle',
      'nsis'
    ),
    rawBundleMatcher: (candidatePath, stats) =>
      stats.isFile() && candidatePath.endsWith('.exe'),
    rustTargetTriple: 'x86_64-pc-windows-msvc'
  },
  macos: {
    assetExtension: '.tar.gz',
    artifactSuffix: 'macos-arm64-unsigned',
    bundleTarget: 'app',
    hostArch: 'arm64',
    hostPlatform: 'darwin',
    rawBundleDirectory: join(
      workspaceRoot,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'target',
      'release',
      'bundle',
      'macos'
    ),
    rawBundleMatcher: (candidatePath, stats) =>
      stats.isDirectory() && candidatePath.endsWith('.app'),
    rustTargetTriple: 'aarch64-apple-darwin'
  },
  linux: {
    assetExtension: '.AppImage',
    artifactSuffix: 'linux-x64-appimage',
    bundleTarget: 'appimage',
    hostArch: 'x64',
    hostPlatform: 'linux',
    rawBundleDirectory: join(
      workspaceRoot,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'target',
      'release',
      'bundle',
      'appimage'
    ),
    rawBundleMatcher: (candidatePath, stats) =>
      stats.isFile() && candidatePath.endsWith('.AppImage'),
    rustTargetTriple: 'x86_64-unknown-linux-gnu'
  }
};

const packageJsonPath = join(workspaceRoot, 'package.json');
const tauriConfigPath = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'tauri.conf.json'
);
const cargoManifestPath = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'Cargo.toml'
);
const releaseAssetsRoot = join(workspaceRoot, 'dist', 'release-assets');
const publishReleaseRoot = join(workspaceRoot, 'dist', 'publish-release');
const downloadedReleaseAssetsRoot = join(
  workspaceRoot,
  'dist',
  'downloaded-release-assets'
);
const releaseManifestFileName = 'release-manifest.json';
const tauriConfigRelativePath = 'apps/desktop-tauri/src-tauri/tauri.conf.json';
const checksumFileName = 'SHA256SUMS.txt';
const releasePlatformOrder: ReleasePlatform[] = ['windows', 'macos', 'linux'];

function readJsonFile<T>(targetPath: string): T {
  return JSON.parse(readFileSync(targetPath, 'utf8')) as T;
}

function writeJsonFile(targetPath: string, value: unknown) {
  writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function readVersionAuthorities(): VersionAuthorities {
  const packageJson = readJsonFile<{ version: string }>(packageJsonPath);
  const tauriConfig = readJsonFile<{ version: string }>(tauriConfigPath);
  const cargoManifest = readFileSync(cargoManifestPath, 'utf8');
  const cargoVersionMatch = cargoManifest.match(
    /^version\s*=\s*"(?<version>[^"]+)"/m
  );

  if (!cargoVersionMatch?.groups?.version) {
    throw new Error(
      `Unable to read the package version from ${cargoManifestPath}.`
    );
  }

  return {
    cargoManifest: cargoVersionMatch.groups.version,
    packageJson: packageJson.version,
    tauriConfig: tauriConfig.version
  };
}

export function parseStableReleaseTag(releaseTag: string) {
  const match = releaseTag.match(/^v(?<version>\d+\.\d+\.\d+)$/);

  if (!match?.groups?.version) {
    throw new Error(
      `Expected a stable release tag like v2.0.0, received "${releaseTag}".`
    );
  }

  return match.groups.version;
}

export function parseStableVersion(version: string) {
  const normalizedVersion = version.trim();

  if (!/^\d+\.\d+\.\d+$/.test(normalizedVersion)) {
    throw new Error(
      `Expected a stable version like 2.0.0, received "${version}".`
    );
  }

  return normalizedVersion;
}

export function buildStableReleaseTag(version: string) {
  return `v${parseStableVersion(version)}`;
}

export function assertVersionAuthoritiesInSync(expectedVersion?: string) {
  const authorities = readVersionAuthorities();
  const discoveredVersions = new Set(Object.values(authorities));

  if (discoveredVersions.size !== 1) {
    throw new Error(
      `Version authorities are out of sync: package.json=${authorities.packageJson}, tauri.conf.json=${authorities.tauriConfig}, Cargo.toml=${authorities.cargoManifest}.`
    );
  }

  const [resolvedVersion] = [...discoveredVersions];

  if (expectedVersion && resolvedVersion !== expectedVersion) {
    throw new Error(
      `Checked-out version ${resolvedVersion} does not match requested release tag version ${expectedVersion}.`
    );
  }

  return resolvedVersion;
}

export function resolveReleasePlatform(
  platformInput: string | undefined,
  hostPlatform: NodeJS.Platform = process.platform
): ReleasePlatform {
  if (platformInput) {
    if (
      platformInput === 'windows' ||
      platformInput === 'macos' ||
      platformInput === 'linux'
    ) {
      return platformInput;
    }

    throw new Error(
      `Unsupported release platform "${platformInput}". Expected one of windows, macos, or linux.`
    );
  }

  if (hostPlatform === 'win32') {
    return 'windows';
  }

  if (hostPlatform === 'darwin') {
    return 'macos';
  }

  if (hostPlatform === 'linux') {
    return 'linux';
  }

  throw new Error(
    `Unable to infer a release platform for host platform "${hostPlatform}".`
  );
}

export function buildArtifactName(version: string, platform: ReleasePlatform) {
  return `tag-check-desktop-v${version}-${releaseArtifactDefinitions[platform].artifactSuffix}`;
}

export function buildAssetFileName(version: string, platform: ReleasePlatform) {
  return `${buildArtifactName(version, platform)}${releaseArtifactDefinitions[platform].assetExtension}`;
}

export function createChecksumFileContents(manifests: ReleaseManifest[]) {
  return releasePlatformOrder
    .map((platform) =>
      manifests.find((manifest) => manifest.platform === platform)
    )
    .filter((manifest): manifest is ReleaseManifest => Boolean(manifest))
    .map((manifest) => `${manifest.sha256}  ${manifest.assetFileName}`)
    .join('\n');
}

function resolveReleaseDirectory(platform: ReleasePlatform) {
  return join(releaseAssetsRoot, platform);
}

function removeAndRecreateDirectory(targetPath: string) {
  rmSync(targetPath, { force: true, recursive: true });
  mkdirSync(targetPath, { recursive: true });
}

function ensureDirectory(targetPath: string) {
  mkdirSync(targetPath, { recursive: true });
}

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

function validateHostForPlatform(platform: ReleasePlatform) {
  const definition = releaseArtifactDefinitions[platform];
  const hostTriple = getRustTargetTriple();

  if (process.platform !== definition.hostPlatform) {
    throw new Error(
      `The ${platform} release must be built on ${definition.hostPlatform}, but this host is ${process.platform}.`
    );
  }

  if (process.arch !== definition.hostArch) {
    throw new Error(
      `The ${platform} release requires a ${definition.hostArch} host, but this host is ${process.arch}.`
    );
  }

  if (hostTriple !== definition.rustTargetTriple) {
    throw new Error(
      `The ${platform} release requires Rust target triple ${definition.rustTargetTriple}, but rustc reports ${hostTriple}.`
    );
  }
}

function resolveRawBundlePath(platform: ReleasePlatform) {
  const definition = releaseArtifactDefinitions[platform];

  if (!existsSync(definition.rawBundleDirectory)) {
    throw new Error(
      `Expected raw bundle directory ${definition.rawBundleDirectory} to exist after tauri build.`
    );
  }

  const candidates = readdirSync(definition.rawBundleDirectory)
    .map((entry) => join(definition.rawBundleDirectory, entry))
    .filter((candidatePath) =>
      definition.rawBundleMatcher(candidatePath, statSync(candidatePath))
    );

  if (candidates.length !== 1) {
    throw new Error(
      `Expected exactly one ${platform} bundle artifact in ${definition.rawBundleDirectory}, found ${candidates.length}.`
    );
  }

  return candidates[0];
}

function cleanRawBundleDirectory(platform: ReleasePlatform) {
  rmSync(releaseArtifactDefinitions[platform].rawBundleDirectory, {
    force: true,
    recursive: true
  });
}

function copyFileWithMode(sourcePath: string, targetPath: string) {
  copyFileSync(sourcePath, targetPath);
  chmodSync(targetPath, statSync(sourcePath).mode);
}

function hashFile(targetPath: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(targetPath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function archiveDirectoryAsTarGz(sourcePath: string, targetPath: string) {
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(targetPath);
    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: { level: 9 }
    });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourcePath, basename(sourcePath));
    void archive.finalize();
  });
}

async function materializeReleaseAsset(
  platform: ReleasePlatform,
  sourcePath: string,
  targetPath: string
) {
  if (platform === 'macos') {
    await archiveDirectoryAsTarGz(sourcePath, targetPath);
    return;
  }

  copyFileWithMode(sourcePath, targetPath);
}

function readReleaseManifest(manifestPath: string): ReleaseManifest {
  return readJsonFile<ReleaseManifest>(manifestPath);
}

function walkForFiles(targetPath: string, fileName: string): string[] {
  if (!existsSync(targetPath)) {
    return [];
  }

  const results: string[] = [];

  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    const entryPath = join(targetPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkForFiles(entryPath, fileName));
      continue;
    }

    if (entry.isFile() && entry.name === fileName) {
      results.push(entryPath);
    }
  }

  return results;
}

export async function assembleReleaseAssets(
  artifactsRoot: string,
  outputDirectory: string,
  expectedVersion: string
) {
  const manifestPaths = walkForFiles(artifactsRoot, releaseManifestFileName);

  if (manifestPaths.length !== releasePlatformOrder.length) {
    throw new Error(
      `Expected ${releasePlatformOrder.length} release manifests in ${artifactsRoot}, found ${manifestPaths.length}.`
    );
  }

  removeAndRecreateDirectory(outputDirectory);
  const manifests: ReleaseManifest[] = [];

  for (const platform of releasePlatformOrder) {
    const manifestPath = manifestPaths.find(
      (candidatePath) =>
        candidatePath.includes(`\\${platform}\\`) ||
        candidatePath.includes(`/${platform}/`) ||
        candidatePath.includes(
          `\\${buildArtifactName(expectedVersion, platform)}\\`
        ) ||
        candidatePath.includes(
          `/${buildArtifactName(expectedVersion, platform)}/`
        )
    );

    if (!manifestPath) {
      throw new Error(`Missing downloaded manifest for ${platform}.`);
    }

    const manifest = readReleaseManifest(manifestPath);
    const expectedAssetFileName = buildAssetFileName(expectedVersion, platform);
    const expectedArtifactName = buildArtifactName(expectedVersion, platform);

    if (manifest.platform !== platform) {
      throw new Error(
        `Manifest ${manifestPath} declared platform ${manifest.platform} but ${platform} was expected.`
      );
    }

    if (manifest.version !== expectedVersion) {
      throw new Error(
        `Manifest ${manifestPath} declared version ${manifest.version} but ${expectedVersion} was expected.`
      );
    }

    if (manifest.assetFileName !== expectedAssetFileName) {
      throw new Error(
        `Manifest ${manifestPath} declared asset file ${manifest.assetFileName} but ${expectedAssetFileName} was expected.`
      );
    }

    if (manifest.artifactName !== expectedArtifactName) {
      throw new Error(
        `Manifest ${manifestPath} declared artifact name ${manifest.artifactName} but ${expectedArtifactName} was expected.`
      );
    }

    const assetPath = join(dirname(manifestPath), manifest.assetFileName);

    if (!existsSync(assetPath)) {
      throw new Error(
        `Expected asset ${assetPath} referenced by ${manifestPath}.`
      );
    }

    const computedSha = await hashFile(assetPath);
    if (computedSha !== manifest.sha256) {
      throw new Error(
        `Checksum mismatch for ${assetPath}. Expected ${manifest.sha256}, computed ${computedSha}.`
      );
    }

    const assembledAssetPath = join(outputDirectory, manifest.assetFileName);
    copyFileWithMode(assetPath, assembledAssetPath);
    manifests.push({
      ...manifest,
      sha256: computedSha
    });
  }

  const checksumFilePath = join(outputDirectory, checksumFileName);
  writeFileSync(
    checksumFilePath,
    `${createChecksumFileContents(manifests)}\n`,
    'utf8'
  );

  appendGithubOutput({
    checksum_file: checksumFilePath,
    release_directory: outputDirectory
  });

  return manifests;
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

async function bundleReleaseArtifact(args: string[]) {
  const platform = resolveReleasePlatform(getArgumentValue('--platform', args));
  const version = assertVersionAuthoritiesInSync();
  validateHostForPlatform(platform);
  cleanRawBundleDirectory(platform);

  const releaseDirectory = resolveReleaseDirectory(platform);
  removeAndRecreateDirectory(releaseDirectory);

  runSyncCommandOrThrow({
    args: [
      'exec',
      'tauri',
      'build',
      '--config',
      tauriConfigRelativePath,
      '--bundles',
      releaseArtifactDefinitions[platform].bundleTarget,
      '--ci'
    ],
    command: getPnpmCommand(),
    cwd: workspaceRoot,
    stdio: 'inherit'
  });

  const rawBundlePath = resolveRawBundlePath(platform);
  const assetFileName = buildAssetFileName(version, platform);
  const assetPath = join(releaseDirectory, assetFileName);

  await materializeReleaseAsset(platform, rawBundlePath, assetPath);

  const manifest: ReleaseManifest = {
    artifactName: buildArtifactName(version, platform),
    assetFileName,
    bundleTarget: releaseArtifactDefinitions[platform].bundleTarget,
    generatedAt: new Date().toISOString(),
    platform,
    rustTargetTriple: releaseArtifactDefinitions[platform].rustTargetTriple,
    sha256: await hashFile(assetPath),
    version
  };

  writeJsonFile(join(releaseDirectory, releaseManifestFileName), manifest);
  console.log(
    `Prepared ${platform} desktop release asset ${assetPath} and manifest ${join(
      releaseDirectory,
      releaseManifestFileName
    )}.`
  );
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
    expectedVersion
  );

  console.log(
    `Assembled ${manifests.length} release assets and ${checksumFileName} in ${outputDirectory}.`
  );
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'assemble':
      await assembleRelease(args);
      break;
    case 'bundle':
      await bundleReleaseArtifact(args);
      break;
    case 'describe':
      await describeRelease(args);
      break;
    default:
      throw new Error('Expected one of: describe, bundle, assemble.');
  }
}

if (isDirectEntrypoint(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
