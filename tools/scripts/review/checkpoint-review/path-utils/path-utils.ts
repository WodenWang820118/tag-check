export function normalizeReviewPath(candidate: string): string {
  const normalized = candidate
    .replaceAll('\\', '/')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\/+/, '')
    .replace(/^\.\//, '')
    .trim();

  // Bare anchors match anywhere in the path; slash-prefixed ones (after the
  // bare ones) match whole segments and drop the leading slash.
  const workspaceAnchors = [
    'tools/scripts/',
    'scripts/',
    'apps/',
    'libs/',
    'packages/',
    'docs/',
    '.agents/',
    '.github/',
    '.codex/',
    '.gemini/',
    'AGENTS.md',
    'sync-skills.ps1',
    '/tools/scripts/',
    '/apps/',
    '/libs/',
    '/packages/',
    '/scripts/',
    '/tools/',
    '/docs/',
    '/.agents/',
    '/.github/',
    '/.codex/',
    '/.gemini/',
    '/AGENTS.md',
    '/sync-skills.ps1'
  ];

  for (const anchor of workspaceAnchors) {
    const index = normalized.indexOf(anchor);
    if (index >= 0) {
      return normalized.slice(index + (anchor.startsWith('/') ? 1 : 0));
    }
  }

  return normalized;
}

export function normalizeReviewPathList(
  paths: ReadonlyArray<string>
): string[] {
  return paths.map(normalizeReviewPath).filter(Boolean);
}

export function matchesPathPattern(
  filePath: string,
  patterns: ReadonlyArray<RegExp>
): boolean {
  const normalizedPath = normalizeReviewPath(filePath);
  return patterns.some((pattern) => pattern.test(normalizedPath));
}
