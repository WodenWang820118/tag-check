import { readFileSync, writeFileSync } from 'node:fs';
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
  versionFile: string;
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
export const versionFilePath = join(workspaceRoot, 'VERSION');
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

function writeJsonFile(targetPath: string, contents: unknown) {
  writeFileSync(targetPath, `${JSON.stringify(contents, null, 2)}\n`, 'utf8');
}

function getCargoPackageSection(contents: string) {
  const packageHeaderMatch = contents.match(/^\[package\]\s*$/m);

  if (packageHeaderMatch?.index === undefined) {
    throw new Error(
      `Unable to locate the [package] section in ${cargoManifestPath}.`
    );
  }

  const sectionStart = packageHeaderMatch.index + packageHeaderMatch[0].length;
  const remainingContents = contents.slice(sectionStart);
  const nextSectionMatch = remainingContents.match(/^\[[^\r\n]+\]\s*$/m);
  const sectionEnd =
    nextSectionMatch?.index === undefined
      ? contents.length
      : sectionStart + nextSectionMatch.index;

  return {
    section: contents.slice(sectionStart, sectionEnd),
    sectionEnd,
    sectionStart
  };
}

function readCargoManifestVersion() {
  const cargoManifest = readFileSync(cargoManifestPath, 'utf8');
  const { section } = getCargoPackageSection(cargoManifest);
  const cargoVersionMatch = section.match(
    /^version\s*=\s*"(?<version>[^"]+)"/m
  );

  if (!cargoVersionMatch?.groups?.version) {
    throw new Error(
      `Unable to read the package version from ${cargoManifestPath}.`
    );
  }

  return parseStableVersion(cargoVersionMatch.groups.version);
}

function updateCargoManifestVersion(contents: string, version: string) {
  const { section, sectionEnd, sectionStart } =
    getCargoPackageSection(contents);

  if (!/^version\s*=\s*"[^"]+"/m.test(section)) {
    throw new Error(
      `Unable to update the package version in ${cargoManifestPath}.`
    );
  }

  const nextSection = section.replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${version}"`
  );
  return `${contents.slice(0, sectionStart)}${nextSection}${contents.slice(sectionEnd)}`;
}

export function readCanonicalVersion() {
  return parseStableVersion(readFileSync(versionFilePath, 'utf8'));
}

export function readVersionAuthorities(): VersionAuthorities {
  const authorities = readRawVersionAuthorities();

  return {
    cargoManifest: parseStableVersion(authorities.cargoManifest),
    packageJson: parseStableVersion(authorities.packageJson),
    tauriConfig: parseStableVersion(authorities.tauriConfig),
    versionFile: parseStableVersion(authorities.versionFile)
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
  const expectedAuthorityVersion = authorities.versionFile;
  const consumerAuthorities = [
    ['package.json', authorities.packageJson],
    ['tauri.conf.json', authorities.tauriConfig],
    ['Cargo.toml', authorities.cargoManifest]
  ] as const;
  const mismatchedAuthorities = consumerAuthorities.filter(
    ([, version]) => version !== expectedAuthorityVersion
  );

  if (mismatchedAuthorities.length > 0) {
    throw new Error(
      `Version authorities are out of sync: VERSION=${authorities.versionFile}, package.json=${authorities.packageJson}, tauri.conf.json=${authorities.tauriConfig}, Cargo.toml=${authorities.cargoManifest}.`
    );
  }

  const resolvedVersion = expectedAuthorityVersion;

  if (expectedVersion && resolvedVersion !== expectedVersion) {
    throw new Error(
      `Checked-out version ${resolvedVersion} does not match requested release tag version ${expectedVersion}.`
    );
  }

  return resolvedVersion;
}

function readRawVersionAuthorities(): VersionAuthorities {
  const packageJson = readJsonFile<{ version: string }>(packageJsonPath);
  const tauriConfig = readJsonFile<{ version: string }>(tauriConfigPath);
  const cargoManifest = readFileSync(cargoManifestPath, 'utf8');
  const { section } = getCargoPackageSection(cargoManifest);
  const cargoVersionMatch = section.match(
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
    tauriConfig: tauriConfig.version,
    versionFile: readFileSync(versionFilePath, 'utf8')
  };
}

function tryParseStableVersion(version: string) {
  try {
    return parseStableVersion(version);
  } catch {
    return undefined;
  }
}

function compareStableVersions(left: string, right: string) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let index = 0; index < leftParts.length; index += 1) {
    const difference = leftParts[index] - rightParts[index];

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

function resolveLatestStableVersionAuthority() {
  const validVersions = Object.values(readRawVersionAuthorities())
    .map(tryParseStableVersion)
    .filter((version): version is string => Boolean(version));

  if (validVersions.length === 0) {
    throw new Error(
      'Unable to synchronize versions because no stable version authority was found.'
    );
  }

  return validVersions.reduce((latestVersion, candidateVersion) =>
    compareStableVersions(candidateVersion, latestVersion) > 0
      ? candidateVersion
      : latestVersion
  );
}

export function syncVersionAuthorities(version?: string) {
  const normalizedVersion = version
    ? parseStableVersion(version)
    : resolveLatestStableVersionAuthority();
  const packageJson = readJsonFile<Record<string, unknown>>(packageJsonPath);
  const tauriConfig = readJsonFile<Record<string, unknown>>(tauriConfigPath);
  const cargoManifest = readFileSync(cargoManifestPath, 'utf8');

  writeFileSync(versionFilePath, `${normalizedVersion}\n`, 'utf8');
  writeJsonFile(packageJsonPath, {
    ...packageJson,
    version: normalizedVersion
  });
  writeJsonFile(tauriConfigPath, {
    ...tauriConfig,
    version: normalizedVersion
  });
  writeFileSync(
    cargoManifestPath,
    updateCargoManifestVersion(cargoManifest, normalizedVersion),
    'utf8'
  );

  return normalizedVersion;
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
