import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assembleReleaseAssets,
  assertVersionAuthoritiesInSync,
  buildBundleCommandArgs,
  buildTauriBundleCommand,
  buildStableReleaseTag,
  buildArtifactName,
  buildAssetFileName,
  createChecksumFileContents,
  parseStableReleaseTag,
  readCanonicalVersion,
  pruneLinuxAppImageBackendPrebuilds,
  readVersionAuthorities,
  resolveReleasePlatform,
  runPlatformRelease,
  validateReleaseArtifact,
  type ReleaseManifest
} from './release.ts';

const temporaryDirectories: string[] = [];
const fixtureVersion = '2.0.0';
const fixturePlatformDefinitions = [
  {
    bundleTarget: 'nsis',
    content: 'windows release asset',
    platform: 'windows' as const,
    rustTargetTriple: 'x86_64-pc-windows-msvc'
  },
  {
    bundleTarget: 'app',
    content: 'macos release asset',
    platform: 'macos' as const,
    rustTargetTriple: 'aarch64-apple-darwin'
  },
  {
    bundleTarget: 'appimage',
    content: 'linux release asset',
    platform: 'linux' as const,
    rustTargetTriple: 'x86_64-unknown-linux-gnu'
  }
] satisfies Array<{
  bundleTarget: ReleaseManifest['bundleTarget'];
  content: string;
  platform: ReleaseManifest['platform'];
  rustTargetTriple: ReleaseManifest['rustTargetTriple'];
}>;

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
  vi.resetModules();
  vi.clearAllMocks();
  vi.doUnmock('../path-contract/path-contract.ts');
  vi.doUnmock('../../shared/process.ts');
  vi.doUnmock('../node-sidecar/node-sidecar.ts');
  vi.doUnmock('./release-assets.ts');
  vi.doUnmock('./release-contract.ts');
  vi.doUnmock('./release.ts');
});

function createFixtureDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'tag-check-release-'));
  temporaryDirectories.push(directory);
  return directory;
}

function createVersionWorkspaceFixture(
  versions: {
    cargoManifest?: string;
    packageJson?: string;
    tauriConfig?: string;
    versionFile?: string;
  } = {}
) {
  const workspaceRoot = createFixtureDirectory();
  const desktopTauriRoot = join(
    workspaceRoot,
    'apps',
    'desktop-tauri',
    'src-tauri'
  );
  const resolvedVersions = {
    cargoManifest: versions.cargoManifest ?? fixtureVersion,
    packageJson: versions.packageJson ?? fixtureVersion,
    tauriConfig: versions.tauriConfig ?? fixtureVersion,
    versionFile: versions.versionFile ?? fixtureVersion
  };

  mkdirSync(desktopTauriRoot, { recursive: true });
  writeFileSync(
    join(workspaceRoot, 'package.json'),
    `${JSON.stringify({ name: 'tag-check', version: resolvedVersions.packageJson }, null, 2)}\n`,
    'utf8'
  );
  writeFileSync(
    join(workspaceRoot, 'VERSION'),
    `${resolvedVersions.versionFile}\n`,
    'utf8'
  );
  writeFileSync(
    join(desktopTauriRoot, 'tauri.conf.json'),
    `${JSON.stringify({ productName: 'Tag Check Desktop', version: resolvedVersions.tauriConfig }, null, 2)}\n`,
    'utf8'
  );
  writeFileSync(
    join(desktopTauriRoot, 'Cargo.toml'),
    [
      '[package]',
      'name = "desktop-tauri"',
      `version = "${resolvedVersions.cargoManifest}"`,
      'edition = "2021"',
      ''
    ].join('\n'),
    'utf8'
  );

  return workspaceRoot;
}

async function loadReleaseContractWorkspaceModule(
  versions: Parameters<typeof createVersionWorkspaceFixture>[0] = {}
) {
  const workspaceRoot = createVersionWorkspaceFixture(versions);

  vi.resetModules();
  vi.doMock('../path-contract/path-contract.ts', () => ({
    workspaceRoot
  }));

  return {
    releaseContractModule: await import('./release-contract.ts'),
    workspaceRoot
  };
}

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

function createReleaseManifest(
  platformDefinition: (typeof fixturePlatformDefinitions)[number],
  assetContents: string,
  overrides: Partial<ReleaseManifest> = {}
): ReleaseManifest {
  return {
    artifactName: buildArtifactName(
      fixtureVersion,
      platformDefinition.platform
    ),
    assetFileName: buildAssetFileName(
      fixtureVersion,
      platformDefinition.platform
    ),
    bundleTarget: platformDefinition.bundleTarget,
    generatedAt: '2026-05-08T00:00:00.000Z',
    platform: platformDefinition.platform,
    rustTargetTriple: platformDefinition.rustTargetTriple,
    sha256: hashContent(assetContents),
    version: fixtureVersion,
    ...overrides
  };
}

function writeFixtureArtifact(
  artifactsRoot: string,
  platformDefinition: (typeof fixturePlatformDefinitions)[number],
  options: {
    assetContents?: string;
    invalidManifestContents?: string;
    manifestOverrides?: Partial<ReleaseManifest>;
    skipAsset?: boolean;
  } = {}
) {
  const artifactName = buildArtifactName(
    fixtureVersion,
    platformDefinition.platform
  );
  const artifactDirectory = join(artifactsRoot, artifactName);
  const assetContents =
    options.assetContents ?? `${platformDefinition.content}\n`;
  const manifest = createReleaseManifest(
    platformDefinition,
    assetContents,
    options.manifestOverrides
  );
  const assetPath = join(artifactDirectory, manifest.assetFileName);
  const manifestPath = join(artifactDirectory, 'release-manifest.json');

  mkdirSync(artifactDirectory, { recursive: true });

  if (!options.skipAsset) {
    writeFileSync(assetPath, assetContents, 'utf8');
  }

  writeFileSync(
    manifestPath,
    options.invalidManifestContents ??
      JSON.stringify(manifest satisfies ReleaseManifest, null, 2),
    'utf8'
  );

  return {
    artifactDirectory,
    assetContents,
    assetPath,
    manifest,
    manifestPath
  };
}

async function loadBundleReleaseTestModule(
  options: {
    buildError?: Error;
    rawBundleContents?: string;
    rustTargetTriple?: string;
  } = {}
) {
  const rawBundleDirectory = createFixtureDirectory();
  const releaseAssetsRoot = createFixtureDirectory();
  const runSyncCommandOrThrow = vi.fn((input: unknown) => {
    if (options.buildError) {
      throw options.buildError;
    }

    mkdirSync(rawBundleDirectory, { recursive: true });
    writeFileSync(
      join(rawBundleDirectory, 'tag-check-installer.exe'),
      options.rawBundleContents ?? 'bundled desktop asset',
      'utf8'
    );
    return input;
  });
  const getRustTargetTriple = vi.fn(
    () => options.rustTargetTriple ?? 'x86_64-pc-windows-msvc'
  );

  vi.resetModules();
  vi.doMock('../../shared/process.ts', async () => {
    const actual = await vi.importActual<
      typeof import('../../shared/process.ts')
    >('../../shared/process.ts');
    return {
      ...actual,
      getShellSafePackageManagerCommand: () => ({
        command: 'pnpm.cmd',
        shell: true
      }),
      runSyncCommandOrThrow
    };
  });
  vi.doMock('../node-sidecar/node-sidecar.ts', async () => {
    const actual = await vi.importActual<
      typeof import('../node-sidecar/node-sidecar.ts')
    >('../node-sidecar/node-sidecar.ts');
    return {
      ...actual,
      getRustTargetTriple
    };
  });
  vi.doMock('./release-contract.ts', async () => {
    const actual = await vi.importActual<
      typeof import('./release-contract.ts')
    >('./release-contract.ts');
    return {
      ...actual,
      releaseAssetsRoot,
      releaseArtifactDefinitions: {
        ...actual.releaseArtifactDefinitions,
        windows: {
          ...actual.releaseArtifactDefinitions.windows,
          rawBundleDirectory
        }
      }
    };
  });

  const module = await import('./release-assets.ts');

  return {
    ...module,
    rawBundleDirectory,
    releaseAssetsRoot,
    runSyncCommandOrThrow
  };
}

async function loadReleaseEntrypointTestModule(
  platform: 'windows' | 'macos' | 'linux',
  options: {
    prepareRuntimeError?: Error;
    versionError?: Error;
  } = {}
) {
  const bundleReleaseArtifact = vi.fn(async () => ({
    assetPath: `dist/release-assets/${platform}/asset`,
    manifest: {} as ReleaseManifest,
    manifestPath: `dist/release-assets/${platform}/release-manifest.json`
  }));
  const runSyncCommandOrThrow = vi.fn(() => {
    if (options.prepareRuntimeError) {
      throw options.prepareRuntimeError;
    }
  });
  const assertVersionAuthoritiesInSyncMock = vi.fn(() => {
    if (options.versionError) {
      throw options.versionError;
    }

    return fixtureVersion;
  });

  vi.resetModules();
  vi.doMock('../../shared/process.ts', async () => {
    const actual = await vi.importActual<
      typeof import('../../shared/process.ts')
    >('../../shared/process.ts');
    return {
      ...actual,
      getShellSafePackageManagerCommand: () => ({
        command: 'pnpm.cmd',
        shell: true
      }),
      runSyncCommandOrThrow
    };
  });
  vi.doMock('./release-assets.ts', async () => {
    const actual = await vi.importActual<typeof import('./release-assets.ts')>(
      './release-assets.ts'
    );
    return {
      ...actual,
      bundleReleaseArtifact
    };
  });
  vi.doMock('./release-contract.ts', async () => {
    const actual = await vi.importActual<
      typeof import('./release-contract.ts')
    >('./release-contract.ts');
    return {
      ...actual,
      assertVersionAuthoritiesInSync: assertVersionAuthoritiesInSyncMock
    };
  });

  const releaseModule = await import('./release.ts');
  const entrypointModule = await import(`./release-${platform}.ts`);

  return {
    assertVersionAuthoritiesInSyncMock,
    bundleReleaseArtifact,
    entrypointModule,
    releaseModule,
    runSyncCommandOrThrow
  };
}

async function loadReleaseEntrypointRoutingTestModule(
  platform: 'windows' | 'macos' | 'linux'
) {
  const runPlatformReleaseMock = vi.fn();

  vi.resetModules();
  vi.doMock('./release.ts', async () => {
    const actual =
      await vi.importActual<typeof import('./release.ts')>('./release.ts');
    return {
      ...actual,
      runPlatformRelease: runPlatformReleaseMock
    };
  });

  const entrypointModule = await import(`./release-${platform}.ts`);

  return {
    entrypointModule,
    runPlatformReleaseMock
  };
}

async function loadReleaseCliTestModule() {
  const assembleReleaseAssetsMock = vi.fn(async () => []);
  const validateReleaseArtifactMock = vi.fn(async () => ({
    assetPath: 'dist/release-assets/windows/asset.exe',
    manifest: {} as ReleaseManifest,
    manifestPath: 'dist/release-assets/windows/release-manifest.json',
    releaseDirectory: 'dist/release-assets/windows'
  }));
  const assertVersionAuthoritiesInSyncMock = vi.fn(() => fixtureVersion);

  vi.resetModules();
  vi.doMock('./release-assets.ts', async () => {
    const actual = await vi.importActual<typeof import('./release-assets.ts')>(
      './release-assets.ts'
    );
    return {
      ...actual,
      assembleReleaseAssets: assembleReleaseAssetsMock,
      validateReleaseArtifact: validateReleaseArtifactMock
    };
  });
  vi.doMock('./release-contract.ts', async () => {
    const actual = await vi.importActual<
      typeof import('./release-contract.ts')
    >('./release-contract.ts');
    return {
      ...actual,
      assertVersionAuthoritiesInSync: assertVersionAuthoritiesInSyncMock
    };
  });

  const releaseModule = await import('./release.ts');

  return {
    assembleReleaseAssetsMock,
    assertVersionAuthoritiesInSyncMock,
    releaseModule,
    validateReleaseArtifactMock
  };
}

describe('release helper', () => {
  it('parses only stable release tags', () => {
    expect(parseStableReleaseTag('v2.0.0')).toBe('2.0.0');
    expect(() => parseStableReleaseTag('v2.0.0-alpha')).toThrow(
      /stable release tag/
    );
  });

  it('builds canonical stable release tags from plain versions', () => {
    expect(buildStableReleaseTag('2.0.0')).toBe('v2.0.0');
    expect(() => buildStableReleaseTag('v2.0.0')).toThrow(/stable version/);
  });

  it('resolves canonical desktop artifact names', () => {
    expect(buildArtifactName('2.0.0', 'windows')).toBe(
      'tag-check-desktop-v2.0.0-windows-x64-nsis'
    );
    expect(buildAssetFileName('2.0.0', 'macos')).toBe(
      'tag-check-desktop-v2.0.0-macos-arm64-unsigned.tar.gz'
    );
    expect(buildAssetFileName('2.0.0', 'linux')).toBe(
      'tag-check-desktop-v2.0.0-linux-x64-appimage.AppImage'
    );
  });

  it('maps host platforms to release platforms', () => {
    expect(resolveReleasePlatform(undefined, 'win32')).toBe('windows');
    expect(resolveReleasePlatform(undefined, 'darwin')).toBe('macos');
    expect(resolveReleasePlatform(undefined, 'linux')).toBe('linux');
  });

  it('builds stable tauri bundle commands per platform', () => {
    expect(buildBundleCommandArgs('windows')).toEqual([
      'exec',
      'tauri',
      'build',
      '--config',
      'apps/desktop-tauri/src-tauri/tauri.conf.json',
      '--bundles',
      'nsis',
      '--ci'
    ]);
    expect(buildBundleCommandArgs('macos').at(-2)).toBe('app');
    expect(buildBundleCommandArgs('linux')).toEqual([
      'exec',
      'tauri',
      'build',
      '--config',
      'apps/desktop-tauri/src-tauri/tauri.conf.json',
      '--bundles',
      'appimage',
      '--ci',
      '--verbose'
    ]);
    expect(buildTauriBundleCommand('windows', 'win32')).toEqual({
      args: buildBundleCommandArgs('windows'),
      command: 'pnpm',
      shell: true
    });
    expect(buildTauriBundleCommand('linux', 'linux')).toMatchObject({
      command: 'pnpm',
      shell: false
    });
  });

  it('bundles windows artifacts with the expected tauri command and manifest', async () => {
    const { bundleReleaseArtifact, releaseAssetsRoot, runSyncCommandOrThrow } =
      await loadBundleReleaseTestModule({
        rawBundleContents: 'bundled windows artifact'
      });

    const { assetPath, manifest, manifestPath } = await bundleReleaseArtifact(
      'windows',
      fixtureVersion
    );

    expect(runSyncCommandOrThrow).toHaveBeenCalledWith({
      args: [
        'exec',
        'tauri',
        'build',
        '--config',
        'apps/desktop-tauri/src-tauri/tauri.conf.json',
        '--bundles',
        'nsis',
        '--ci'
      ],
      command: 'pnpm.cmd',
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit'
    });
    expect(assetPath).toBe(
      join(
        releaseAssetsRoot,
        'windows',
        buildAssetFileName(fixtureVersion, 'windows')
      )
    );
    expect(readFileSync(assetPath, 'utf8')).toBe('bundled windows artifact');
    expect(manifest).toMatchObject({
      artifactName: buildArtifactName(fixtureVersion, 'windows'),
      assetFileName: buildAssetFileName(fixtureVersion, 'windows'),
      bundleTarget: 'nsis',
      platform: 'windows',
      rustTargetTriple: 'x86_64-pc-windows-msvc',
      version: fixtureVersion
    });
    expect(readFileSync(manifestPath, 'utf8')).toContain(
      `"artifactName": "${buildArtifactName(fixtureVersion, 'windows')}"`
    );
  });

  it('validates a built release artifact and checksum', async () => {
    const releaseAssetsRoot = createFixtureDirectory();
    const platformDefinition = fixturePlatformDefinitions[0];
    const releaseDirectory = join(
      releaseAssetsRoot,
      platformDefinition.platform
    );
    const assetContents = 'built artifact\n';
    const manifest = createReleaseManifest(platformDefinition, assetContents);

    mkdirSync(releaseDirectory, { recursive: true });
    writeFileSync(
      join(releaseDirectory, manifest.assetFileName),
      assetContents,
      'utf8'
    );
    writeFileSync(
      join(releaseDirectory, 'release-manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    await expect(
      validateReleaseArtifact('windows', fixtureVersion, releaseAssetsRoot)
    ).resolves.toMatchObject({
      assetPath: join(releaseDirectory, manifest.assetFileName),
      manifest: expect.objectContaining({ sha256: hashContent(assetContents) }),
      manifestPath: join(releaseDirectory, 'release-manifest.json'),
      releaseDirectory
    });
  });

  it('prunes non-Linux x64 GNU backend prebuild directories before Linux AppImage builds', () => {
    const backendDirectory = createFixtureDirectory();
    const prebuildDirectory = join(
      backendDirectory,
      'node_modules',
      'native',
      'prebuilds'
    );

    for (const directoryName of [
      'linux-x64',
      'linux-x64-glibc',
      'linux-x64-gnu',
      'darwin-arm64',
      'win32-x64'
    ]) {
      mkdirSync(join(prebuildDirectory, directoryName), { recursive: true });
    }

    const removedDirectories = pruneLinuxAppImageBackendPrebuilds(
      backendDirectory
    )
      .map((directoryPath) => relative(prebuildDirectory, directoryPath))
      .sort();

    expect(removedDirectories).toEqual(['darwin-arm64', 'win32-x64']);
    expect(readdirSync(prebuildDirectory).sort()).toEqual([
      'linux-x64',
      'linux-x64-glibc',
      'linux-x64-gnu'
    ]);
  });

  it('fails bundling on host mismatch before running the tauri build', async () => {
    const { bundleReleaseArtifact, runSyncCommandOrThrow } =
      await loadBundleReleaseTestModule();

    await expect(
      bundleReleaseArtifact('macos', fixtureVersion)
    ).rejects.toThrow(/must be built on darwin/u);
    expect(runSyncCommandOrThrow).not.toHaveBeenCalled();
  });

  it('propagates tauri build failures from the bundle command', async () => {
    const { bundleReleaseArtifact, runSyncCommandOrThrow } =
      await loadBundleReleaseTestModule({
        buildError: new Error('tauri build failed')
      });

    await expect(
      bundleReleaseArtifact('windows', fixtureVersion)
    ).rejects.toThrow('tauri build failed');
    expect(runSyncCommandOrThrow).toHaveBeenCalledOnce();
  });

  it('prepares the runtime before bundling a platform release', async () => {
    const {
      assertVersionAuthoritiesInSyncMock,
      bundleReleaseArtifact,
      releaseModule,
      runSyncCommandOrThrow
    } = await loadReleaseEntrypointTestModule('windows');

    await releaseModule.runPlatformRelease('windows');

    expect(runSyncCommandOrThrow).toHaveBeenCalledWith({
      args: ['nx', 'run', 'desktop-tauri:prepare-runtime'],
      command: 'pnpm.cmd',
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit'
    });
    expect(assertVersionAuthoritiesInSyncMock).toHaveBeenCalledOnce();
    expect(bundleReleaseArtifact).toHaveBeenCalledWith(
      'windows',
      fixtureVersion
    );
  });

  it('routes dedicated platform entrypoints through the shared release helper', async () => {
    const windowsModule =
      await loadReleaseEntrypointRoutingTestModule('windows');
    await windowsModule.entrypointModule.main();
    expect(windowsModule.runPlatformReleaseMock).toHaveBeenCalledWith(
      'windows'
    );

    const macosModule = await loadReleaseEntrypointRoutingTestModule('macos');
    await macosModule.entrypointModule.main();
    expect(macosModule.runPlatformReleaseMock).toHaveBeenCalledWith('macos');

    const linuxModule = await loadReleaseEntrypointRoutingTestModule('linux');
    await linuxModule.entrypointModule.main();
    expect(linuxModule.runPlatformReleaseMock).toHaveBeenCalledWith('linux');
  });

  it('propagates prepare-runtime failures before bundling a platform release', async () => {
    const { bundleReleaseArtifact, releaseModule, runSyncCommandOrThrow } =
      await loadReleaseEntrypointTestModule('windows', {
        prepareRuntimeError: new Error('prepare runtime failed')
      });

    await expect(releaseModule.runPlatformRelease('windows')).rejects.toThrow(
      'prepare runtime failed'
    );
    expect(runSyncCommandOrThrow).toHaveBeenCalledOnce();
    expect(bundleReleaseArtifact).not.toHaveBeenCalled();
  });

  it('propagates version authority failures before bundling a platform release', async () => {
    const {
      assertVersionAuthoritiesInSyncMock,
      bundleReleaseArtifact,
      releaseModule
    } = await loadReleaseEntrypointTestModule('windows', {
      versionError: new Error('version mismatch')
    });

    await expect(releaseModule.runPlatformRelease('windows')).rejects.toThrow(
      'version mismatch'
    );
    expect(assertVersionAuthoritiesInSyncMock).toHaveBeenCalledOnce();
    expect(bundleReleaseArtifact).not.toHaveBeenCalled();
  });

  it('dispatches the assemble CLI through the shared release assembler', async () => {
    const {
      assembleReleaseAssetsMock,
      assertVersionAuthoritiesInSyncMock,
      releaseModule
    } = await loadReleaseCliTestModule();
    const originalArgv = process.argv;

    process.argv = [
      'node',
      'tools/scripts/tauri/release/release.ts',
      'assemble',
      '--release-tag',
      'v2.0.0',
      '--artifacts-root',
      'tmp/artifacts',
      '--output-dir',
      'tmp/publish'
    ];

    try {
      await releaseModule.main();
    } finally {
      process.argv = originalArgv;
    }

    expect(assertVersionAuthoritiesInSyncMock).toHaveBeenCalledWith(
      fixtureVersion
    );
    expect(assembleReleaseAssetsMock).toHaveBeenCalledWith(
      'tmp/artifacts',
      'tmp/publish',
      fixtureVersion,
      expect.any(Function)
    );
  });

  it('dispatches validate-artifact CLI through the shared artifact validator', async () => {
    const {
      assertVersionAuthoritiesInSyncMock,
      releaseModule,
      validateReleaseArtifactMock
    } = await loadReleaseCliTestModule();
    const originalArgv = process.argv;

    process.argv = [
      'node',
      'tools/scripts/tauri/release/release.ts',
      'validate-artifact',
      '--platform',
      'windows',
      '--release-tag',
      'v2.0.0'
    ];

    try {
      await releaseModule.main();
    } finally {
      process.argv = originalArgv;
    }

    expect(assertVersionAuthoritiesInSyncMock).toHaveBeenCalledWith(
      fixtureVersion
    );
    expect(validateReleaseArtifactMock).toHaveBeenCalledWith(
      'windows',
      fixtureVersion
    );
  });

  it('re-exports the shared platform release helper', async () => {
    expect(runPlatformRelease).toBeTypeOf('function');
  });

  it('formats checksum files in release order', () => {
    const manifests: ReleaseManifest[] = [
      {
        artifactName: 'tag-check-desktop-v2.0.0-linux-x64-appimage',
        assetFileName: 'tag-check-desktop-v2.0.0-linux-x64-appimage.AppImage',
        bundleTarget: 'appimage',
        generatedAt: '2026-05-08T00:00:00.000Z',
        platform: 'linux',
        rustTargetTriple: 'x86_64-unknown-linux-gnu',
        sha256: 'linux-hash',
        version: '2.0.0'
      },
      {
        artifactName: 'tag-check-desktop-v2.0.0-windows-x64-nsis',
        assetFileName: 'tag-check-desktop-v2.0.0-windows-x64-nsis.exe',
        bundleTarget: 'nsis',
        generatedAt: '2026-05-08T00:00:00.000Z',
        platform: 'windows',
        rustTargetTriple: 'x86_64-pc-windows-msvc',
        sha256: 'windows-hash',
        version: '2.0.0'
      },
      {
        artifactName: 'tag-check-desktop-v2.0.0-macos-arm64-unsigned',
        assetFileName: 'tag-check-desktop-v2.0.0-macos-arm64-unsigned.tar.gz',
        bundleTarget: 'app',
        generatedAt: '2026-05-08T00:00:00.000Z',
        platform: 'macos',
        rustTargetTriple: 'aarch64-apple-darwin',
        sha256: 'macos-hash',
        version: '2.0.0'
      }
    ];

    expect(createChecksumFileContents(manifests)).toBe(
      [
        'windows-hash  tag-check-desktop-v2.0.0-windows-x64-nsis.exe',
        'macos-hash  tag-check-desktop-v2.0.0-macos-arm64-unsigned.tar.gz',
        'linux-hash  tag-check-desktop-v2.0.0-linux-x64-appimage.AppImage'
      ].join('\n')
    );
  });

  it('keeps VERSION and consumer manifests in lockstep', () => {
    const checkedInVersion = readCanonicalVersion();

    expect(readVersionAuthorities()).toEqual({
      cargoManifest: checkedInVersion,
      packageJson: checkedInVersion,
      tauriConfig: checkedInVersion,
      versionFile: checkedInVersion
    });
    expect(assertVersionAuthoritiesInSync(checkedInVersion)).toBe(
      checkedInVersion
    );
  });

  it('fails when VERSION and a consumer manifest diverge', async () => {
    const { releaseContractModule } = await loadReleaseContractWorkspaceModule({
      cargoManifest: '2.1.0',
      packageJson: '2.0.0',
      tauriConfig: '2.1.0',
      versionFile: '2.1.0'
    });

    expect(() =>
      releaseContractModule.assertVersionAuthoritiesInSync()
    ).toThrow(
      'Version authorities are out of sync: VERSION=2.1.0, package.json=2.0.0, tauri.conf.json=2.1.0, Cargo.toml=2.1.0.'
    );
  });

  it('rejects invalid VERSION contents before release work starts', async () => {
    const { releaseContractModule } = await loadReleaseContractWorkspaceModule({
      versionFile: '2.1.0-beta.1'
    });

    expect(() => releaseContractModule.readCanonicalVersion()).toThrow(
      /stable version/
    );
  });

  it('synchronizes VERSION, package.json, tauri.conf.json, and Cargo.toml to the latest authority version', async () => {
    const { releaseContractModule, workspaceRoot } =
      await loadReleaseContractWorkspaceModule({
        cargoManifest: '2.1.0',
        packageJson: '2.0.0',
        tauriConfig: '2.2.0',
        versionFile: '2.0.1'
      });

    expect(releaseContractModule.syncVersionAuthorities()).toBe('2.2.0');
    expect(releaseContractModule.readVersionAuthorities()).toEqual({
      cargoManifest: '2.2.0',
      packageJson: '2.2.0',
      tauriConfig: '2.2.0',
      versionFile: '2.2.0'
    });
    expect(readFileSync(join(workspaceRoot, 'VERSION'), 'utf8')).toBe(
      '2.2.0\n'
    );
    expect(
      JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf8'))
    ).toMatchObject({
      version: '2.2.0'
    });
    expect(
      JSON.parse(
        readFileSync(
          join(
            workspaceRoot,
            'apps',
            'desktop-tauri',
            'src-tauri',
            'tauri.conf.json'
          ),
          'utf8'
        )
      )
    ).toMatchObject({
      version: '2.2.0'
    });
    expect(
      readFileSync(
        join(workspaceRoot, 'apps', 'desktop-tauri', 'src-tauri', 'Cargo.toml'),
        'utf8'
      )
    ).toContain('version = "2.2.0"');
  });

  it('uses numeric semver ordering when selecting the latest version authority', async () => {
    const { releaseContractModule } = await loadReleaseContractWorkspaceModule({
      cargoManifest: '2.9.9',
      packageJson: '2.10.0',
      tauriConfig: '2.0.0',
      versionFile: '2.1.0'
    });

    expect(releaseContractModule.syncVersionAuthorities()).toBe('2.10.0');
    expect(releaseContractModule.readVersionAuthorities()).toEqual({
      cargoManifest: '2.10.0',
      packageJson: '2.10.0',
      tauriConfig: '2.10.0',
      versionFile: '2.10.0'
    });
  });

  it('ignores malformed version authorities when a stable version can be recovered', async () => {
    const { releaseContractModule } = await loadReleaseContractWorkspaceModule({
      cargoManifest: '2.1.0-beta.1',
      packageJson: '2.3.0',
      tauriConfig: 'invalid',
      versionFile: '2.2.0'
    });

    expect(releaseContractModule.syncVersionAuthorities()).toBe('2.3.0');
    expect(releaseContractModule.readVersionAuthorities()).toEqual({
      cargoManifest: '2.3.0',
      packageJson: '2.3.0',
      tauriConfig: '2.3.0',
      versionFile: '2.3.0'
    });
  });

  it('fails to synchronize when no stable version authority can be recovered', async () => {
    const { releaseContractModule } = await loadReleaseContractWorkspaceModule({
      cargoManifest: 'invalid',
      packageJson: 'invalid',
      tauriConfig: 'invalid',
      versionFile: 'invalid'
    });

    expect(() => releaseContractModule.syncVersionAuthorities()).toThrow(
      'Unable to synchronize versions because no stable version authority was found.'
    );
  });

  it('allows explicit sync-version callers to choose the target version', async () => {
    const { releaseContractModule } = await loadReleaseContractWorkspaceModule({
      cargoManifest: '2.3.0',
      packageJson: '2.2.0',
      tauriConfig: '2.1.0',
      versionFile: '2.0.0'
    });

    expect(releaseContractModule.syncVersionAuthorities('2.1.1')).toBe('2.1.1');
    expect(releaseContractModule.readVersionAuthorities()).toEqual({
      cargoManifest: '2.1.1',
      packageJson: '2.1.1',
      tauriConfig: '2.1.1',
      versionFile: '2.1.1'
    });
  });

  it('keeps sync-version idempotent when Cargo.toml already matches VERSION', async () => {
    const { releaseContractModule, workspaceRoot } =
      await loadReleaseContractWorkspaceModule({
        cargoManifest: '2.1.0',
        packageJson: '2.1.0',
        tauriConfig: '2.1.0',
        versionFile: '2.1.0'
      });
    const cargoManifestPath = join(
      workspaceRoot,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'Cargo.toml'
    );
    const originalCargoManifest = readFileSync(cargoManifestPath, 'utf8');

    expect(releaseContractModule.syncVersionAuthorities()).toBe('2.1.0');
    expect(readFileSync(cargoManifestPath, 'utf8')).toBe(originalCargoManifest);
    expect(releaseContractModule.readVersionAuthorities()).toEqual({
      cargoManifest: '2.1.0',
      packageJson: '2.1.0',
      tauriConfig: '2.1.0',
      versionFile: '2.1.0'
    });
  });

  it('assembles validated release assets from downloaded artifacts', async () => {
    const artifactsRoot = createFixtureDirectory();
    const outputDirectory = createFixtureDirectory();
    for (const platformDefinition of fixturePlatformDefinitions) {
      writeFixtureArtifact(artifactsRoot, platformDefinition);
    }

    const manifests = await assembleReleaseAssets(
      artifactsRoot,
      outputDirectory,
      fixtureVersion
    );

    expect(manifests.map((manifest) => manifest.platform)).toEqual([
      'windows',
      'macos',
      'linux'
    ]);
    expect(readFileSync(join(outputDirectory, 'SHA256SUMS.txt'), 'utf8')).toBe(
      `${createChecksumFileContents(manifests)}\n`
    );

    for (const platformDefinition of fixturePlatformDefinitions) {
      expect(
        readFileSync(
          join(
            outputDirectory,
            buildAssetFileName(fixtureVersion, platformDefinition.platform)
          ),
          'utf8'
        )
      ).toBe(`${platformDefinition.content}\n`);
    }
  });

  it('fails assembly when a manifest references a missing asset', async () => {
    const artifactsRoot = createFixtureDirectory();
    const outputDirectory = createFixtureDirectory();

    for (const platformDefinition of fixturePlatformDefinitions) {
      writeFixtureArtifact(artifactsRoot, platformDefinition, {
        skipAsset: platformDefinition.platform === 'macos'
      });
    }

    await expect(
      assembleReleaseAssets(artifactsRoot, outputDirectory, fixtureVersion)
    ).rejects.toThrow(
      /Expected asset .* referenced by .*release-manifest\.json/u
    );
  });

  it('fails assembly when a downloaded asset checksum does not match its manifest', async () => {
    const artifactsRoot = createFixtureDirectory();
    const outputDirectory = createFixtureDirectory();

    for (const platformDefinition of fixturePlatformDefinitions) {
      writeFixtureArtifact(artifactsRoot, platformDefinition, {
        manifestOverrides:
          platformDefinition.platform === 'linux'
            ? { sha256: hashContent('checksum-from-a-different-artifact\n') }
            : undefined
      });
    }

    await expect(
      assembleReleaseAssets(artifactsRoot, outputDirectory, fixtureVersion)
    ).rejects.toThrow(/Checksum mismatch/u);
  });

  it('fails assembly when a downloaded manifest is malformed JSON', async () => {
    const artifactsRoot = createFixtureDirectory();
    const outputDirectory = createFixtureDirectory();

    for (const platformDefinition of fixturePlatformDefinitions) {
      writeFixtureArtifact(artifactsRoot, platformDefinition, {
        invalidManifestContents:
          platformDefinition.platform === 'windows'
            ? '{"artifactName":'
            : undefined
      });
    }

    await expect(
      assembleReleaseAssets(artifactsRoot, outputDirectory, fixtureVersion)
    ).rejects.toThrow();
  });

  it('keeps the desktop release workflow aligned with the cross-platform contract', () => {
    const workflow = readFileSync(
      join(process.cwd(), '.github', 'workflows', 'release.yaml'),
      'utf8'
    );

    expect(workflow).toContain('  push:');
    expect(workflow).toContain('concurrency:');
    expect(workflow).toContain('group: desktop-release');
    expect(workflow).toContain('    branches:');
    expect(workflow).toContain('      - main');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('checkout_ref:');
    expect(workflow).toContain(
      'checkout_ref: ${{ steps.release_gate.outputs.checkout_ref }}'
    );
    expect(workflow).toContain('should_release:');
    expect(workflow).toContain('skip_reason:');
    expect(workflow).toContain('const notesPath = join(');
    expect(workflow).toContain("docs',");
    expect(workflow).toContain("releases',");
    expect(workflow).toContain('Missing \\${notesPath}.');
    expect(workflow).toContain('fail-fast: false');
    expect(workflow).not.toContain("cache: 'pnpm'");
    expect(workflow).toContain('platform: windows');
    expect(workflow).toContain('platform: macos');
    expect(workflow).toContain('platform: linux');
    expect(workflow).toContain('release_script: tauri:release:windows');
    expect(workflow).toContain('release_script: tauri:release:macos');
    expect(workflow).toContain('release_script: tauri:release:linux');
    expect(workflow).toContain('run: pnpm run ${{ matrix.release_script }}');
    expect(workflow).toContain('build-essential');
    expect(workflow).toContain('desktop-file-utils');
    expect(workflow).toContain(
      'libfuse2t64 || sudo apt-get install -y libfuse2'
    );
    expect(workflow).toContain('command -v mksquashfs');
    expect(workflow).toContain(
      'validate-artifact --platform ${{ matrix.platform }} --release-tag ${{ needs.prepare-release.outputs.release_tag }}'
    );
    expect(workflow).toMatch(
      /publish-release:\s+needs:\s+- prepare-release\s+- build-desktop/su
    );
    expect(workflow).toContain(
      "if: ${{ needs.prepare-release.outputs.should_release == 'true' }}"
    );
    expect(workflow).toContain(
      'pattern: tag-check-desktop-v${{ steps.release_context.outputs.release_version }}-*'
    );
    expect(workflow).toContain(
      'node tools/scripts/tauri/release/release.ts assemble --release-tag ${{ needs.prepare-release.outputs.release_tag }} --artifacts-root dist/downloaded-release-assets --output-dir dist/publish-release'
    );
    expect(workflow).toContain(
      'Release already exists for ${existing.tag}; skipping duplicate draft creation.'
    );
    expect(workflow).toContain('const tagRefPath = (tag) => `tags/${tag}`;');
    expect(workflow).toContain(
      'const fullTagRef = (tag) => `refs/${tagRefPath(tag)}`;'
    );
    expect(workflow).toContain('github.rest.git.updateRef');
    expect(workflow).toContain('force: true');
    expect(workflow).toContain("core.setOutput('checkout_ref', checkoutRef);");
    expect(workflow).toContain('leaving it unchanged');
    expect(workflow).toContain('Validate checksum manifest');
    expect(workflow).toContain('uses: softprops/action-gh-release@v2');
    expect(workflow).toContain('draft: true');
  });

  it('keeps package and Nx release wiring aligned with the platform entrypoints', () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8')
    ) as {
      scripts: Record<string, string>;
    };
    const desktopProject = JSON.parse(
      readFileSync(
        join(process.cwd(), 'apps', 'desktop-tauri', 'project.json'),
        'utf8'
      )
    ) as {
      targets: Record<
        string,
        { dependsOn?: string[]; options?: { command?: string } }
      >;
    };

    expect(packageJson.scripts['tauri:release:windows']).toBe(
      'node tools/scripts/tauri/release/release-windows.ts'
    );
    expect(packageJson.scripts['tauri:release:macos']).toBe(
      'node tools/scripts/tauri/release/release-macos.ts'
    );
    expect(packageJson.scripts['tauri:release:linux']).toBe(
      'node tools/scripts/tauri/release/release-linux.ts'
    );
    expect(packageJson.scripts['bundle-tauri:windows']).toBe(
      'pnpm run tauri:release:windows'
    );
    expect(packageJson.scripts['bundle-tauri:macos']).toBe(
      'pnpm run tauri:release:macos'
    );
    expect(packageJson.scripts['bundle-tauri:linux']).toBe(
      'pnpm run tauri:release:linux'
    );

    expect(desktopProject.targets['bundle-windows'].options?.command).toBe(
      'node tools/scripts/tauri/release/release-windows.ts'
    );
    expect(desktopProject.targets['bundle-macos'].options?.command).toBe(
      'node tools/scripts/tauri/release/release-macos.ts'
    );
    expect(desktopProject.targets['bundle-linux'].options?.command).toBe(
      'node tools/scripts/tauri/release/release-linux.ts'
    );
    expect(desktopProject.targets['bundle-windows'].dependsOn).toBeUndefined();
    expect(desktopProject.targets['bundle-macos'].dependsOn).toBeUndefined();
    expect(desktopProject.targets['bundle-linux'].dependsOn).toBeUndefined();
  });
});
