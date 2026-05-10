import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

import archiver from 'archiver';

import {
  getShellSafePackageManagerCommand,
  runSyncCommandOrThrow
} from '../../shared/process.ts';
import { getRustTargetTriple } from '../node-sidecar/node-sidecar.ts';
import {
  backendDistDir,
  workspaceRoot
} from '../path-contract/path-contract.ts';
import {
  buildArtifactName,
  buildAssetFileName,
  checksumFileName,
  createChecksumFileContents,
  linuxAppImagePrebuildDirectories,
  releaseArtifactDefinitions,
  releaseAssetsRoot,
  releaseManifestFileName,
  releasePlatformOrder,
  tauriConfigRelativePath,
  type ReleaseManifest,
  type ReleasePlatform
} from './release-contract.ts';

export interface GithubOutputWriter {
  (entries: Record<string, string>): void;
}

export interface ReleaseArtifactValidationResult {
  assetPath: string;
  manifest: ReleaseManifest;
  manifestPath: string;
  releaseDirectory: string;
}

export interface TauriBundleCommand {
  args: string[];
  command: string;
  shell: boolean;
}

function writeJsonFile(targetPath: string, value: unknown) {
  writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJsonFile<T>(targetPath: string): T {
  return JSON.parse(readFileSync(targetPath, 'utf8')) as T;
}

function resolveReleaseDirectory(
  platform: ReleasePlatform,
  assetsRoot = releaseAssetsRoot
) {
  return join(assetsRoot, platform);
}

function removeAndRecreateDirectory(targetPath: string) {
  rmSync(targetPath, { force: true, recursive: true });
  mkdirSync(targetPath, { recursive: true });
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

async function hashFile(targetPath: string) {
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

export function buildBundleCommandArgs(platform: ReleasePlatform) {
  return buildTauriBundleCommand(platform).args;
}

export function buildTauriBundleCommand(
  platform: ReleasePlatform,
  hostPlatform: NodeJS.Platform = process.platform
): TauriBundleCommand {
  const packageManagerCommand = getShellSafePackageManagerCommand(
    'pnpm',
    hostPlatform
  );
  const args = [
    'exec',
    'tauri',
    'build',
    '--config',
    tauriConfigRelativePath,
    '--bundles',
    releaseArtifactDefinitions[platform].bundleTarget,
    '--ci'
  ];

  if (platform === 'linux') {
    args.push('--verbose');
  }

  return {
    args,
    command: packageManagerCommand.command,
    shell: packageManagerCommand.shell
  };
}

export async function validateReleaseArtifact(
  platform: ReleasePlatform,
  expectedVersion: string,
  assetsRoot = releaseAssetsRoot
): Promise<ReleaseArtifactValidationResult> {
  const releaseDirectory = resolveReleaseDirectory(platform, assetsRoot);
  const manifestPath = join(releaseDirectory, releaseManifestFileName);

  if (!existsSync(releaseDirectory)) {
    throw new Error(`Expected release directory ${releaseDirectory}.`);
  }

  if (!existsSync(manifestPath)) {
    throw new Error(`Expected release manifest ${manifestPath}.`);
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

  const assetPath = join(releaseDirectory, manifest.assetFileName);

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

  return {
    assetPath,
    manifest: {
      ...manifest,
      sha256: computedSha
    },
    manifestPath,
    releaseDirectory
  };
}

function isLinuxAppImagePrebuildDirectory(directoryName: string) {
  return linuxAppImagePrebuildDirectories.has(directoryName);
}

function collectNativePrebuildDirectories(searchRoot: string) {
  if (!existsSync(searchRoot)) {
    return [];
  }

  const results: string[] = [];

  for (const entry of readdirSync(searchRoot, { withFileTypes: true })) {
    const entryPath = join(searchRoot, entry.name);

    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === 'prebuilds') {
      results.push(entryPath);
    }

    results.push(...collectNativePrebuildDirectories(entryPath));
  }

  return results;
}

export function pruneLinuxAppImageBackendPrebuilds(
  backendDirectory = backendDistDir
) {
  const removedPaths: string[] = [];

  for (const prebuildDirectory of collectNativePrebuildDirectories(
    backendDirectory
  )) {
    for (const entry of readdirSync(prebuildDirectory, {
      withFileTypes: true
    })) {
      if (
        !entry.isDirectory() ||
        isLinuxAppImagePrebuildDirectory(entry.name)
      ) {
        continue;
      }

      const targetPath = join(prebuildDirectory, entry.name);
      rmSync(targetPath, { force: true, recursive: true });
      removedPaths.push(targetPath);
    }
  }

  return removedPaths;
}

export async function bundleReleaseArtifact(
  platform: ReleasePlatform,
  version: string
) {
  validateHostForPlatform(platform);
  cleanRawBundleDirectory(platform);

  const releaseDirectory = resolveReleaseDirectory(platform);
  removeAndRecreateDirectory(releaseDirectory);

  if (platform === 'linux') {
    const removedDirectories = pruneLinuxAppImageBackendPrebuilds();

    if (removedDirectories.length > 0) {
      console.log(
        `Pruned ${removedDirectories.length} non-Linux x64 GNU backend native prebuild directories before Linux AppImage bundling.`
      );

      for (const removedDirectory of removedDirectories) {
        console.log(
          `Pruned backend native prebuild directory: ${relative(
            backendDistDir,
            removedDirectory
          )}`
        );
      }
    }
  }

  const bundleCommand = buildTauriBundleCommand(platform);
  runSyncCommandOrThrow({
    args: bundleCommand.args,
    command: bundleCommand.command,
    cwd: workspaceRoot,
    shell: bundleCommand.shell,
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

  const manifestPath = join(releaseDirectory, releaseManifestFileName);
  writeJsonFile(manifestPath, manifest);

  return {
    assetPath,
    manifest,
    manifestPath
  };
}

export async function assembleReleaseAssets(
  artifactsRoot: string,
  outputDirectory: string,
  expectedVersion: string,
  appendGithubOutput?: GithubOutputWriter
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

  appendGithubOutput?.({
    checksum_file: checksumFilePath,
    release_directory: outputDirectory
  });

  return manifests;
}
