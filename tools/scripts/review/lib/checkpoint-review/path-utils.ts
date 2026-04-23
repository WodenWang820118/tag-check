export function normalizeReviewPath(candidate: string): string {
  const normalized = candidate
    .replaceAll('\\', '/')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\/+/, '')
    .replace(/^\.\//, '')
    .trim();

  const workspaceAnchors = [
    'apps/',
    'libs/',
    'packages/',
    'tools/scripts/',
    'tools/',
    'scripts/',
    'docs/',
    '.agents/',
    '.github/',
    '.codex/',
    '.gemini/',
    'AGENTS.md',
    'sync-skills.ps1'
  ];

  for (const anchor of workspaceAnchors) {
    if (normalized.startsWith(anchor)) {
      return normalized;
    }

    const index = normalized.indexOf(`/${anchor}`);
    if (index >= 0) {
      return normalized.slice(index + 1);
    }
  }

  return normalized;
}

export function normalizeReviewPathList(paths: ReadonlyArray<string>): string[] {
  return paths.map(normalizeReviewPath).filter(Boolean);
}

export function matchesPathPattern(
  filePath: string,
  patterns: ReadonlyArray<RegExp>
): boolean {
  const normalizedPath = normalizeReviewPath(filePath);
  return patterns.some((pattern) => pattern.test(normalizedPath));
}
