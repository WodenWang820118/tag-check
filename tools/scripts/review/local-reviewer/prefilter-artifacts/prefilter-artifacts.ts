import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
  type HybridReviewReport,
  type LocalReviewFinding,
  type LocalReviewReport,
  type PaidReviewContextSelection,
  PREFILTER_ARTIFACT_DIR,
  PREFILTER_CONTEXT_FILE,
  PREFILTER_REPORT_FILE,
  REVIEWER_CONTEXT_FILE,
  SENSITIVE_REVIEW_AREAS
} from '../shared/shared.ts';

export function buildHybridPrefilterContext(input: {
  report: HybridReviewReport;
}): string {
  const changedFiles = input.report.heuristics.changed_files;
  const condensedFiles = changedFiles.slice(0, 8);
  const condensedFindings =
    input.report.merged_findings.length > 0
      ? input.report.merged_findings.slice(0, 5).map((finding) => {
          const location = finding.file_path
            ? finding.line
              ? `${finding.file_path}:${finding.line}`
              : finding.file_path
            : '<repo>';
          return `- [${finding.source}/${finding.severity}] ${finding.title} (${location}) :: ${finding.detail}`;
        })
      : ['- none'];

  return [
    '# Prefilter',
    '',
    `strategy=${input.report.strategy}`,
    `gpt_provider=${input.report.gpt_review.provider}`,
    `gpt_status=${input.report.gpt_review.status}`,
    `gpt_risk=${input.report.gpt_review.overall_risk ?? 'unknown'}`,
    `gpt_confidence=${input.report.gpt_review.confidence ?? 'unknown'}`,
    `local_mode=${input.report.local_mode}`,
    `requested_profiles=${
      input.report.requested_profiles.length > 0
        ? input.report.requested_profiles.join(',')
        : 'none'
    }`,
    `recommended_escalation=${input.report.recommended_escalation ? 'yes' : 'no'}`,
    `summary=${
      input.report.gpt_review.summary ??
      input.report.local_review?.summary ??
      'Hybrid gate completed without a reviewer summary.'
    }`,
    '',
    'reasons:',
    ...(input.report.escalation_reasons.length > 0
      ? input.report.escalation_reasons.map((reason) => `- ${reason}`)
      : ['- none']),
    '',
    'files:',
    ...condensedFiles.map((file) => `- ${file}`),
    ...(changedFiles.length > condensedFiles.length
      ? [`- ... ${changedFiles.length - condensedFiles.length} more file(s)`]
      : []),
    '',
    'findings:',
    ...condensedFindings,
    '',
    'focus:',
    ...deriveSuggestedReviewFocus(
      input.report.merged_findings,
      input.report.escalation_reasons
    )
      .slice(0, 4)
      .map((line) => `- ${line}`)
  ].join('\n');
}

export function getEscalationReasons(input: {
  diffText: string;
  fileCount: number;
  findings: ReadonlyArray<LocalReviewFinding>;
  changedFiles: ReadonlyArray<string>;
  localReviewError?: string;
}): string[] {
  const reasons: string[] = [];

  if (input.localReviewError) {
    reasons.push(`local runtime failure: ${input.localReviewError}`);
  }

  if (
    input.findings.some(
      (finding) =>
        finding.severity === 'critical' || finding.severity === 'high'
    )
  ) {
    reasons.push('local reviewer reported a critical/high finding');
  }

  if (input.fileCount > 15) {
    reasons.push(`diff touches ${input.fileCount} files`);
  }

  const combinedText = `${input.changedFiles.join('\n')}\n${input.diffText}`;
  const categories = SENSITIVE_REVIEW_AREAS.filter(({ pattern }) =>
    pattern.test(combinedText)
  ).map(({ category }) => category);

  if (categories.length > 0) {
    reasons.push(
      `sensitive area detected: ${Array.from(new Set(categories)).join(', ')}`
    );
  }

  return reasons;
}

export function buildPrefilterContext(input: {
  diffText: string;
  escalationReasons: string[];
  findings: ReadonlyArray<LocalReviewFinding>;
  report: LocalReviewReport;
}): string {
  const changedFiles = input.report.context.files.map((file) => file.path);
  const condensedFiles = changedFiles.slice(0, 8);
  const condensedFindings =
    input.findings.length > 0
      ? input.findings.slice(0, 5).map((finding) => {
          const location = finding.file_path
            ? finding.line
              ? `${finding.file_path}:${finding.line}`
              : finding.file_path
            : '<repo>';
          return `- [${finding.severity}] ${finding.title} (${location}) :: ${finding.detail}`;
        })
      : ['- none'];

  return [
    '# Prefilter',
    '',
    `runtime=${input.report.runtime_provider}`,
    `model=${input.report.model_used ?? 'unconfigured'}`,
    `summary=${input.report.summary}`,
    `recommended_escalation=${input.escalationReasons.length > 0 ? 'yes' : 'no'}`,
    '',
    'reasons:',
    ...(input.escalationReasons.length > 0
      ? input.escalationReasons.map((reason) => `- ${reason}`)
      : ['- none']),
    '',
    'files:',
    ...condensedFiles.map((file) => `- ${file}`),
    ...(changedFiles.length > condensedFiles.length
      ? [`- ... ${changedFiles.length - condensedFiles.length} more file(s)`]
      : []),
    '',
    'findings:',
    ...condensedFindings,
    '',
    'focus:',
    ...deriveSuggestedReviewFocus(input.findings, input.escalationReasons)
      .slice(0, 4)
      .map((line) => `- ${line}`)
  ].join('\n');
}

export function buildPrefilterFailureContext(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
  escalationReasons: ReadonlyArray<string>;
  localReviewError: string;
}): string {
  const condensedFiles = input.changedFiles.slice(0, 8);

  return [
    '# Prefilter',
    '',
    'runtime=unavailable',
    'model=unconfigured',
    `summary=local reviewer failed before producing a report: ${input.localReviewError}`,
    'recommended_escalation=yes',
    '',
    'reasons:',
    ...input.escalationReasons.map((reason) => `- ${reason}`),
    '',
    'files:',
    ...(condensedFiles.length > 0
      ? condensedFiles.map((file) => `- ${file}`)
      : ['- none']),
    ...(input.changedFiles.length > condensedFiles.length
      ? [
          `- ... ${input.changedFiles.length - condensedFiles.length} more file(s)`
        ]
      : []),
    '',
    'findings:',
    '- none',
    '',
    'focus:',
    '- Review the full diff because the local reviewer runtime failed',
    '- Investigate the local runtime failure before trusting prefilter results'
  ].join('\n');
}

export function selectPaidReviewContext(input: {
  diffText: string;
  forceFullDiff?: boolean;
  prefilterContext: string;
  smallDiffThresholdChars?: number;
}): PaidReviewContextSelection {
  const diffText = input.diffText.trim();
  const prefilterContext = input.prefilterContext.trim();
  const originalDiffLength = diffText.length;
  const smallDiffThresholdChars =
    input.smallDiffThresholdChars ?? DEFAULT_SMALL_DIFF_THRESHOLD_CHARS;

  if (
    input.forceFullDiff ||
    originalDiffLength <= smallDiffThresholdChars ||
    prefilterContext.length === 0 ||
    prefilterContext.length >= originalDiffLength
  ) {
    return {
      contextLength: originalDiffLength,
      contextText: diffText,
      mode: 'full-diff',
      originalDiffLength,
      smallDiffThresholdChars
    };
  }

  return {
    contextLength: prefilterContext.length,
    contextText: prefilterContext,
    mode: 'prefilter-summary',
    originalDiffLength,
    smallDiffThresholdChars
  };
}

export function writePrefilterArtifacts(input: {
  contextMarkdown: string;
  reportPayload: Record<string, unknown>;
  repoRoot: string;
  reviewContextSelection: PaidReviewContextSelection;
}): { contextPath: string; reportPath: string; reviewContextPath: string } {
  const artifactRoot = resolve(input.repoRoot, ...PREFILTER_ARTIFACT_DIR);
  mkdirSync(artifactRoot, { recursive: true });

  const reportPath = resolve(artifactRoot, PREFILTER_REPORT_FILE);
  const contextPath = resolve(artifactRoot, PREFILTER_CONTEXT_FILE);
  const reviewContextPath = resolve(artifactRoot, REVIEWER_CONTEXT_FILE);
  writeFileSync(
    reportPath,
    JSON.stringify(input.reportPayload, null, 2),
    'utf8'
  );
  writeFileSync(contextPath, `${input.contextMarkdown.trim()}\n`, 'utf8');
  writeFileSync(
    reviewContextPath,
    `${input.reviewContextSelection.contextText.trim()}\n`,
    'utf8'
  );

  return { contextPath, reportPath, reviewContextPath };
}

function deriveSuggestedReviewFocus(
  findings: ReadonlyArray<
    Pick<LocalReviewFinding, 'detail' | 'profile' | 'recommendation'>
  >,
  escalationReasons: ReadonlyArray<string>
): string[] {
  const focus = new Set<string>();

  for (const finding of findings) {
    if (finding.profile) {
      focus.add(`Re-check ${finding.profile} concerns`);
    }
    if (finding.recommendation) {
      focus.add(finding.recommendation);
    }
  }

  for (const reason of escalationReasons) {
    focus.add(reason);
  }

  return focus.size > 0
    ? [...focus]
    : ['General correctness and missing tests'];
}
