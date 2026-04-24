import type { ReviewCheckpoint, ReviewRiskLevel } from '../shared/shared.ts';
import {
  matchesPathPattern,
  normalizeReviewPath,
  normalizeReviewPathList
} from '../path-utils/path-utils.ts';

const CHANGED_FILES_HEADING = 'changed files:';
const LOW_RISK_MAX_CHANGED_FILES = 2;
const REVIEW_CONTROL_PLANE_PATH_PATTERNS = [
  /(^|\/)scripts\/review\//i,
  /(^|\/)scripts\/review-gate\//i,
  /(^|\/)tools\/scripts\/review\//i,
  /(^|\/)tools\/scripts\/review-gate\//i,
  /(^|\/)(scripts|tools\/scripts)\/package\.json$/i,
  /(^|\/)ag(?:ents)?\.md$/i,
  /(^|\/)\.agents\//i,
  /(^|\/)\.github\//i,
  /(^|\/)\.codex\//i,
  /(^|\/)\.gemini\//i,
  /(^|\/)sync-skills\.ps1$/i
] as const;
const HIGH_RISK_PATH_PATTERNS = [
  /(^|\/)(auth|security)(\/|\.|_|-)/i,
  /(^|\/)(route|routes|router|controller|dto|schema|contract|contracts|api)(\/|\.|_|-)/i,
  /(^|\/)(config|env|settings)(\/|\.|_|-)/i,
  /(^|\/)(cli|runner|command)(\/|\.|_|-)/i,
  /(^|\/)(io|store|storage|persist|persistence|repository)(\/|\.|_|-)/i,
  /(^|\/)(net|network|transport|client|upstream)(\/|\.|_|-)/i,
  /(^|\/)(serialization|serializer|serialize|payload)(\/|\.|_|-)/i,
  /(^|\/)(permission|policy|rbac|role|access-control)(\/|\.|_|-)/i
] as const;
const LOW_RISK_PATH_PATTERNS = [
  /\.md$/i,
  /\.(html|css|scss|less|svg|txt)$/i
] as const;
const HIGH_RISK_FOCUS_PATTERNS = [
  /\bsecurity\b/i,
  /\bauth\b/i,
  /\bsecret\b/i,
  /\bshell\b/i,
  /\bnetwork\b/i,
  /\bfilesystem\b/i,
  /\bcontract\b/i,
  /\bapi\b/i,
  /\bschema\b/i,
  /\bmigration\b/i,
  /\bdatabase\b/i,
  /\bpersist(?:ent|ence)?\b/i,
  /\bpermission\b/i
] as const;
const LOW_RISK_FOCUS_BLOCK_PATTERNS = [
  /\bsecurity\b/i,
  /\bauth\b/i,
  /\btest(?:s|ing)?\b/i,
  /\barchitecture\b/i,
  /\bcontract\b/i,
  /\bapi\b/i,
  /\bschema\b/i,
  /\bmigration\b/i
] as const;
const HIGH_RISK_CONTEXT_PATTERNS = [
  /\bauth\b/i,
  /\boauth\b/i,
  /\blogin\b/i,
  /\bsession\b/i,
  /\bjwt\b/i,
  /\bsecret\b/i,
  /\btoken\b/i,
  /\bpassword\b/i,
  /\bcredential\b/i,
  /\bfilesystem\b/i,
  /\breadfile\b/i,
  /\bwritefile\b/i,
  /\bmkdir\b/i,
  /\brename\b/i,
  /\bchild_process\b/i,
  /\bspawn(?:sync)?\b/i,
  /\bexec(?:sync)?\b/i,
  /\bpowershell\b/i,
  /\bfetch\(/i,
  /\baxios\b/i,
  /\bhttp\./i,
  /\bhttps\./i,
  /\bwebhook\b/i,
  /\broute(?:s)?\b/i,
  /\brouter\b/i,
  /\bhandler\b/i,
  /\bendpoint\b/i,
  /\bcontroller\b/i,
  /\bdto\b/i,
  /\bschema\b/i,
  /\bcontract\b/i,
  /\bgraphql\b/i,
  /\bopenapi\b/i,
  /\bpublic contract\b/i,
  /\bresponse shape\b/i,
  /\bpayload\b/i,
  /\bsecurity\b/i,
  /\baccess-control\b/i,
  /\brbac\b/i,
  /\brole\b/i,
  /\bpermission\b/i,
  /\bpolicy\b/i,
  /\bmigration\b/i,
  /\bdatabase\b/i,
  /\bsql\b/i,
  /\bstorage\b/i,
  /\brepository\b/i,
  /\bconfig\b/i,
  /\benv(?:ironment)?\b/i,
  /\bprovider keys?\b/i,
  /\bapi[_-]?key\b/i,
  /\bsubprocess\b/i,
  /\bprocessbuilder\b/i,
  /\brequests\b/i,
  /\bhttpx\b/i,
  /\burllib\b/i,
  /\bhttp client\b/i,
  /\bhttpclient\b/i,
  /\bwebclient\b/i,
  /\bresttemplate\b/i,
  /\bupstream\b/i
] as const;
const MEDIUM_RISK_CONTEXT_PATTERNS = [
  /\brefactor\b/i,
  /\brollout\b/i,
  /\barchitecture\b/i,
  /\bstate machine\b/i,
  /\bmulti-file\b/i
] as const;

export function parseChangedFilesFromContext(context: string): string[] {
  const lines = context.split(/\r?\n/);
  const changedFiles: string[] = [];
  let inChangedFilesSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inChangedFilesSection) {
      if (trimmed.toLowerCase() === CHANGED_FILES_HEADING) {
        inChangedFilesSection = true;
      }
      continue;
    }

    if (trimmed.length === 0) {
      break;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bulletMatch) {
      break;
    }

    changedFiles.push(normalizeReviewPath(bulletMatch[1] ?? ''));
  }

  return changedFiles.filter(Boolean);
}

export function inferAutoReviewRisk(input: {
  checkpoint: ReviewCheckpoint;
  context: string;
  focus: string;
  repoChangedFiles?: string[];
  repoDiffText?: string;
  repoHasUntrackedFiles?: boolean;
}): ReviewRiskLevel {
  const normalizedFocus = input.focus.trim();
  const changedFiles = parseChangedFilesFromContext(input.context);
  const repoChangedFiles = normalizeReviewPathList(
    input.repoChangedFiles ?? []
  );
  const repoDiffText = input.repoDiffText ?? '';
  const combinedText = `${normalizedFocus}\n${input.context}`;

  if (
    containsPattern(normalizedFocus, HIGH_RISK_FOCUS_PATTERNS) ||
    containsPattern(combinedText, HIGH_RISK_CONTEXT_PATTERNS) ||
    changedFiles.some((filePath) =>
      matchesPathPattern(filePath, HIGH_RISK_PATH_PATTERNS)
    ) ||
    changedFiles.some((filePath) => isReviewControlPlanePath(filePath))
  ) {
    return 'high';
  }

  if (
    input.checkpoint !== 'implementation' &&
    input.checkpoint !== 'pre-merge'
  ) {
    return 'medium';
  }

  if (
    changedFiles.length === 0 ||
    changedFiles.length > LOW_RISK_MAX_CHANGED_FILES ||
    !matchesRepoChangedFiles(changedFiles, repoChangedFiles) ||
    input.repoHasUntrackedFiles === true ||
    repoDiffText.trim().length === 0 ||
    !diffMentionsRepoChangedFiles(repoChangedFiles, repoDiffText) ||
    containsPattern(repoDiffText, HIGH_RISK_CONTEXT_PATTERNS) ||
    changedFiles.some(
      (filePath) => !matchesPathPattern(filePath, LOW_RISK_PATH_PATTERNS)
    ) ||
    containsPattern(normalizedFocus, LOW_RISK_FOCUS_BLOCK_PATTERNS) ||
    containsPattern(combinedText, MEDIUM_RISK_CONTEXT_PATTERNS)
  ) {
    return 'medium';
  }

  return 'low';
}

function containsPattern(
  text: string,
  patterns: ReadonlyArray<RegExp>
): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function isReviewControlPlanePath(filePath: string): boolean {
  const normalizedPath = normalizeReviewPath(filePath);
  if (
    REVIEW_CONTROL_PLANE_PATH_PATTERNS.some((pattern) =>
      pattern.test(normalizedPath)
    )
  ) {
    return true;
  }

  return /^package\.json$/i.test(normalizedPath);
}

function matchesRepoChangedFiles(
  contextChangedFiles: ReadonlyArray<string>,
  repoChangedFiles: ReadonlyArray<string>
): boolean {
  if (contextChangedFiles.length === 0 || repoChangedFiles.length === 0) {
    return false;
  }

  const contextSet = new Set(normalizeReviewPathList(contextChangedFiles));
  const repoSet = new Set(normalizeReviewPathList(repoChangedFiles));

  if (contextSet.size !== repoSet.size) {
    return false;
  }

  return [...contextSet].every((filePath) => repoSet.has(filePath));
}

function diffMentionsRepoChangedFiles(
  repoChangedFiles: ReadonlyArray<string>,
  repoDiffText: string
): boolean {
  if (repoChangedFiles.length === 0 || repoDiffText.trim().length === 0) {
    return false;
  }

  return normalizeReviewPathList(repoChangedFiles).every((filePath) =>
    diffContainsFileHeader(repoDiffText, filePath)
  );
}

function diffContainsFileHeader(
  repoDiffText: string,
  filePath: string
): boolean {
  const escapedFilePath = escapeRegExp(filePath);
  const headerPatterns = [
    new RegExp(`^diff --git a/${escapedFilePath} b/${escapedFilePath}$`, 'm'),
    new RegExp(`^diff --git a/${escapedFilePath} b/dev/null$`, 'm'),
    new RegExp(`^diff --git a/dev/null b/${escapedFilePath}$`, 'm'),
    new RegExp(`^--- a/${escapedFilePath}$`, 'm'),
    new RegExp(`^\\+\\+\\+ b/${escapedFilePath}$`, 'm')
  ];

  return headerPatterns.some((pattern) => pattern.test(repoDiffText));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
