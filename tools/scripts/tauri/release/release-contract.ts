import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
    stats: { isDirectory(): boolean; isFile(): boolean }
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

export const packageJsonPath = join(workspaceRoot, 'package.json');
export const tauriConfigPath = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'tauri.conf.json'
);
export const cargoManifestPath = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'Cargo.toml'
);
export const releaseAssetsRoot = join(workspaceRoot, 'dist', 'release-assets');
export const publishReleaseRoot = join(
  workspaceRoot,
  'dist',
  'publish-release'
);
export const downloadedReleaseAssetsRoot = join(
  workspaceRoot,
  'dist',
  'downloaded-release-assets'
);
export const releaseManifestFileName = 'release-manifest.json';
export const tauriConfigRelativePath =
  'apps/desktop-tauri/src-tauri/tauri.conf.json';
export const checksumFileName = 'SHA256SUMS.txt';
export const releasePlatformOrder: ReleasePlatform[] = [
  'windows',
  'macos',
  'linux'
];
export const linuxAppImagePrebuildDirectories = new Set([
  'linux-x64',
  'linux-x64-glibc',
  'linux-x64-gnu'
]);

function readJsonFile<T>(targetPath: string): T {
  return JSON.parse(readFileSync(targetPath, 'utf8')) as T;
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
