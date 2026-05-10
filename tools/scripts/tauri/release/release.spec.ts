import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assembleReleaseAssets,
  assertVersionAuthoritiesInSync,
  buildBundleCommandArgs,
  buildStableReleaseTag,
  buildArtifactName,
  buildAssetFileName,
  createChecksumFileContents,
  parseStableReleaseTag,
  readVersionAuthorities,
  resolveReleasePlatform,
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
  vi.doUnmock('../../shared/process.ts');
  vi.doUnmock('../node-sidecar/node-sidecar.ts');
  vi.doUnmock('./release-contract.ts');
});

function createFixtureDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'tag-check-release-'));
  temporaryDirectories.push(directory);
  return directory;
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
      getPnpmCommand: () => 'pnpm.cmd',
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
    expect(buildBundleCommandArgs('linux').at(-2)).toBe('appimage');
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

  it('keeps the three version authorities in lockstep', () => {
    expect(readVersionAuthorities()).toEqual({
      cargoManifest: fixtureVersion,
      packageJson: fixtureVersion,
      tauriConfig: fixtureVersion
    });
    expect(assertVersionAuthoritiesInSync(fixtureVersion)).toBe(fixtureVersion);
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
    expect(workflow).toContain('    branches:');
    expect(workflow).toContain('      - main');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('checkout_ref:');
    expect(workflow).toContain('should_release:');
    expect(workflow).toContain('skip_reason:');
    expect(workflow).toContain('const notesPath = join(');
    expect(workflow).toContain("docs',");
    expect(workflow).toContain("releases',");
    expect(workflow).toContain('Missing \\${notesPath}.');
    expect(workflow).toContain('fail-fast: false');
    expect(workflow).toContain('platform: windows');
    expect(workflow).toContain('platform: macos');
    expect(workflow).toContain('platform: linux');
    expect(workflow).toContain('nx_target: desktop-tauri:bundle-windows');
    expect(workflow).toContain('nx_target: desktop-tauri:bundle-macos');
    expect(workflow).toContain('nx_target: desktop-tauri:bundle-linux');
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
    expect(workflow).toContain(
      'Existing tag ${tag} points to ${sha}, expected ${checkoutRef}.'
    );
    expect(workflow).toContain('ref: `refs/tags/${releaseTag}`');
    expect(workflow).toContain('Validate checksum manifest');
    expect(workflow).toContain('uses: softprops/action-gh-release@v2');
    expect(workflow).toContain('draft: true');
  });
});
