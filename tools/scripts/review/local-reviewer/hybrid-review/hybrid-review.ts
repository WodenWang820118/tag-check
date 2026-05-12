import {
  createProviderTelemetryContext,
  type ProviderTelemetryContext,
} from '../../provider-observability/provider-observability.ts';
import {
  isCodexUnavailableError,
  probeCodexCliHealth,
  runCodexReview,
} from '../../providers/codex/codex.ts';
import {
  DEFAULT_HYBRID_GPT_MODEL,
  HYBRID_ANGULAR_PATH_PATTERNS,
  HYBRID_NEST_PATH_PATTERNS,
  HYBRID_PROFILE_ORDER,
  HYBRID_REPO_HABITS_PATH_PATTERNS,
  HYBRID_TYPESCRIPT_PATH_PATTERNS,
  MAX_HYBRID_GPT_DIFF_CHARS,
  normalizeHybridPath,
  SENSITIVE_REVIEW_AREAS,
  type HybridConfidenceLevel,
  type HybridDecisionBasis,
  type HybridGptFinding,
  type HybridGptReview,
  type HybridHeuristics,
  type HybridLocalPlan,
  type HybridLocalMode,
  type HybridLocalReviewResult,
  type HybridMergedFinding,
  type HybridReviewProfileName,
  type HybridReviewReport,
  type HybridRiskLevel,
  type LocalReviewFinding,
  type LocalReviewReport,
  type LocalReviewSeverity,
} from '../shared/shared.ts';

export function analyzeHybridHeuristics(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
}): HybridHeuristics {
  const normalizedPaths = input.changedFiles.map(normalizeHybridPath);
  return {
    changed_files: normalizedPaths,
    diff_length: input.diffText.length,
    file_count: normalizedPaths.length,
    routed_profiles: routeHybridProfiles(normalizedPaths),
    sensitive_categories: detectSensitiveReviewAreas({
      changedFiles: normalizedPaths,
      diffText: input.diffText,
    }),
  };
}

export function runHybridGptReview(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
  repoRoot: string;
}): HybridGptReview {
  const provider = 'codex' as const;
  const model = DEFAULT_HYBRID_GPT_MODEL;
  const health = probeCodexCliHealth({
    repoRoot: input.repoRoot,
  });

  if (!health.available) {
    return {
      provider,
      model,
      status: 'unavailable',
      overall_risk: null,
      confidence: null,
      needs_local_deep_review: true,
      focus_profiles: [],
      findings: [],
      summary: null,
      error: health.reason ?? 'Codex CLI is unavailable.',
    };
  }

  try {
    const rawOutput = runCodexReview({
      checkpoint: 'implementation',
      focus: 'general',
      prompt: buildHybridGptPrompt({
        changedFiles: input.changedFiles,
        diffText: input.diffText,
      }),
      repoRoot: input.repoRoot,
    });
    const parsed = parseHybridGptReview(rawOutput);
    return {
      provider,
      model,
      status: 'completed',
      error: null,
      ...parsed,
    };
  } catch (error) {
    const errorText = error instanceof Error ? error.message : String(error);
    return {
      provider,
      model,
      status: isCodexUnavailableError(error) ? 'unavailable' : 'runtime-error',
      overall_risk: null,
      confidence: null,
      needs_local_deep_review: true,
      focus_profiles: [],
      findings: [],
      summary: null,
      error: errorText,
    };
  }
}

export function createHybridGptTelemetryContext(): ProviderTelemetryContext {
  return createProviderTelemetryContext({
    callsite: 'hybrid-gpt-review',
  });
}

export function createHybridGptBypassReview(reason: string): HybridGptReview {
  return {
    provider: 'codex',
    model: DEFAULT_HYBRID_GPT_MODEL,
    status: 'runtime-error',
    overall_risk: null,
    confidence: null,
    needs_local_deep_review: true,
    focus_profiles: [],
    findings: [],
    summary: null,
    error: reason,
  };
}

export function planHybridLocalReview(input: {
  gptReview: HybridGptReview;
  heuristics: HybridHeuristics;
}): HybridLocalPlan {
  if (
    input.heuristics.sensitive_categories.length > 0 ||
    input.heuristics.file_count > 15
  ) {
    return {
      local_mode: 'full',
      requested_profiles: input.heuristics.routed_profiles,
    };
  }

  if (input.gptReview.status !== 'completed') {
    return {
      local_mode: 'full',
      requested_profiles: input.heuristics.routed_profiles,
    };
  }

  if (
    input.gptReview.needs_local_deep_review ||
    input.gptReview.confidence === 'low'
  ) {
    const requestedProfiles = selectRequestedHybridProfiles({
      gptFocusProfiles: input.gptReview.focus_profiles,
      routedProfiles: input.heuristics.routed_profiles,
    });

    return {
      local_mode:
        requestedProfiles.length === input.heuristics.routed_profiles.length
          ? 'full'
          : 'targeted',
      requested_profiles: requestedProfiles,
    };
  }

  return {
    local_mode: 'skipped',
    requested_profiles: [],
  };
}

export function buildHybridReviewReport(input: {
  gptReview: HybridGptReview;
  heuristics: HybridHeuristics;
  localReviewResult?: HybridLocalReviewResult | null;
}): HybridReviewReport {
  const localReview = input.localReviewResult?.report ?? null;
  const localReviewError = input.localReviewResult?.error ?? null;
  const localMode = input.localReviewResult?.local_mode ?? 'skipped';
  const requestedProfiles = input.localReviewResult?.requested_profiles ?? [];
  const mergedFindings = mergeHybridFindings({
    gptFindings: input.gptReview.findings,
    localFindings: localReview?.findings ?? [],
  });
  const escalationReasons = getHybridEscalationReasons({
    gptReview: input.gptReview,
    heuristics: input.heuristics,
    localFindings: localReview?.findings ?? [],
    localReviewError,
  });

  return {
    strategy: 'gpt-gate',
    heuristics: input.heuristics,
    gpt_review: input.gptReview,
    local_review: localReview,
    local_mode: localMode,
    requested_profiles: requestedProfiles,
    findings: mergedFindings,
    merged_findings: mergedFindings,
    summary:
      input.gptReview.summary ??
      localReview?.summary ??
      `Hybrid review completed for ${input.heuristics.file_count} file(s).`,
    recommended_escalation: escalationReasons.length > 0,
    escalation_reasons: escalationReasons,
    decision_basis: resolveHybridDecisionBasis({
      gptReview: input.gptReview,
      localReview,
      localReviewError,
      localMode,
    }),
    local_review_error: localReviewError,
  };
}

function buildHybridGptPrompt(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
}): string {
  const routedProfiles = routeHybridProfiles(input.changedFiles);
  return [
    'You are the cloud reviewer in a hybrid local-review prefilter workflow.',
    'Return JSON only. Do not include markdown fences, commentary, or prose outside the JSON object.',
    'Use this exact schema:',
    '{"overall_risk":"low|medium|high","confidence":"low|medium|high","needs_local_deep_review":true,"focus_profiles":["angular","nest","typescript","repo-habits","general"],"findings":[{"severity":"critical|high|medium|low|info","title":"...","detail":"...","file_path":"path/or/null","line":12,"recommendation":"..."}],"summary":"..."}',
    '',
    'Rules:',
    '- Mark `needs_local_deep_review` true when you are uncertain, when the diff touches risky areas, or when local evidence would materially help.',
    '- Keep `focus_profiles` inside the allowed set and prefer the routed profiles when possible.',
    '- Return an empty findings array if nothing actionable stands out.',
    '',
    'Changed files:',
    ...input.changedFiles.map((file) => `- ${normalizeHybridPath(file)}`),
    '',
    `Routed local profiles: ${routedProfiles.join(', ')}`,
    '',
    'Diff to review:',
    input.diffText.trim(),
  ].join('\n');
}

function parseHybridGptReview(
  rawOutput: string,
): Omit<HybridGptReview, 'error' | 'model' | 'provider' | 'status'> {
  const payload = extractJsonObject(rawOutput);
  const parsed = JSON.parse(payload) as Record<string, unknown>;
  const overallRisk = normalizeHybridRisk(parsed.overall_risk);
  const confidence = normalizeHybridConfidence(parsed.confidence);
  const summary = normalizeRequiredText(parsed.summary, 'summary');

  return {
    overall_risk: overallRisk,
    confidence,
    needs_local_deep_review: normalizeBoolean(
      parsed.needs_local_deep_review,
      'needs_local_deep_review',
    ),
    focus_profiles: normalizeHybridProfileList(parsed.focus_profiles),
    findings: normalizeHybridGptFindings(parsed.findings),
    summary,
  };
}

function extractJsonObject(rawOutput: string): string {
  const trimmed = rawOutput.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Hybrid GPT reviewer did not return a JSON object.');
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function normalizeHybridRisk(value: unknown): HybridRiskLevel {
  const normalized = normalizeOptionalText(value)?.toLowerCase();
  if (
    normalized === 'low' ||
    normalized === 'medium' ||
    normalized === 'high'
  ) {
    return normalized;
  }

  throw new Error('Hybrid GPT review returned an invalid overall_risk value.');
}

function normalizeHybridConfidence(value: unknown): HybridConfidenceLevel {
  const normalized = normalizeOptionalText(value)?.toLowerCase();
  if (
    normalized === 'low' ||
    normalized === 'medium' ||
    normalized === 'high'
  ) {
    return normalized;
  }

  throw new Error('Hybrid GPT review returned an invalid confidence value.');
}

function normalizeRequiredText(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Hybrid GPT review returned an invalid ${fieldName} value.`,
    );
  }

  return value.trim();
}

function normalizeBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(
      `Hybrid GPT review returned a non-boolean ${fieldName} value.`,
    );
  }

  return value;
}

function normalizeHybridProfileList(value: unknown): HybridReviewProfileName[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is HybridReviewProfileName =>
          item === 'angular' ||
          item === 'nest' ||
          item === 'typescript' ||
          item === 'repo-habits' ||
          item === 'general',
      ),
    ),
  );
}

function normalizeHybridGptFindings(value: unknown): HybridGptFinding[] {
  if (!Array.isArray(value)) {
    throw new Error('Hybrid GPT review returned a non-array findings value.');
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(
        `Hybrid GPT review returned an invalid finding at index ${index}.`,
      );
    }

    const finding = entry as Record<string, unknown>;
    return {
      severity: normalizeLocalReviewSeverity(finding.severity),
      title: normalizeRequiredText(finding.title, `findings[${index}].title`),
      detail: normalizeRequiredText(
        finding.detail,
        `findings[${index}].detail`,
      ),
      file_path: normalizeOptionalText(finding.file_path),
      line: normalizeOptionalLineNumber(finding.line),
      recommendation: normalizeOptionalText(finding.recommendation),
    };
  });
}

function normalizeLocalReviewSeverity(value: unknown): LocalReviewSeverity {
  if (
    value === 'critical' ||
    value === 'high' ||
    value === 'medium' ||
    value === 'low' ||
    value === 'info'
  ) {
    return value;
  }

  return 'info';
}

function normalizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalLineNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function routeHybridProfiles(
  changedFiles: ReadonlyArray<string>,
): HybridReviewProfileName[] {
  const routed = new Set<HybridReviewProfileName>();

  for (const file of changedFiles) {
    routed.add(routeHybridProfileForPath(file));
  }

  if (routed.size === 0) {
    routed.add('general');
  }

  return HYBRID_PROFILE_ORDER.filter((profile) => routed.has(profile));
}

function routeHybridProfileForPath(filePath: string): HybridReviewProfileName {
  const normalizedPath = normalizeHybridPath(filePath);

  if (matchesAnyPattern(normalizedPath, HYBRID_ANGULAR_PATH_PATTERNS)) {
    return 'angular';
  }

  if (matchesAnyPattern(normalizedPath, HYBRID_NEST_PATH_PATTERNS)) {
    return 'nest';
  }

  if (matchesAnyPattern(normalizedPath, HYBRID_TYPESCRIPT_PATH_PATTERNS)) {
    return 'typescript';
  }

  if (matchesAnyPattern(normalizedPath, HYBRID_REPO_HABITS_PATH_PATTERNS)) {
    return 'repo-habits';
  }

  return 'general';
}

function matchesAnyPattern(
  normalizedPath: string,
  patterns: ReadonlyArray<RegExp>,
): boolean {
  return patterns.some((pattern) => pattern.test(normalizedPath));
}

function detectSensitiveReviewAreas(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
}): HybridHeuristics['sensitive_categories'] {
  const combinedText = `${input.changedFiles.join('\n')}\n${input.diffText}`;
  return SENSITIVE_REVIEW_AREAS.filter(({ pattern }) =>
    pattern.test(combinedText),
  ).map(({ category }) => category);
}

function selectRequestedHybridProfiles(input: {
  gptFocusProfiles: ReadonlyArray<HybridReviewProfileName>;
  routedProfiles: ReadonlyArray<HybridReviewProfileName>;
}): HybridReviewProfileName[] {
  const routed = new Set(input.routedProfiles);
  const intersection = input.gptFocusProfiles.filter((profile) =>
    routed.has(profile),
  );

  if (intersection.length > 0) {
    return HYBRID_PROFILE_ORDER.filter((profile) =>
      intersection.includes(profile),
    );
  }

  if (input.routedProfiles.length > 0) {
    return [...input.routedProfiles];
  }

  return ['general'];
}

function mergeHybridFindings(input: {
  gptFindings: ReadonlyArray<HybridGptFinding>;
  localFindings: ReadonlyArray<LocalReviewFinding>;
}): HybridMergedFinding[] {
  const unique: HybridMergedFinding[] = [];
  const seen = new Set<string>();

  for (const finding of input.gptFindings) {
    const normalized = normalizeHybridMergedFinding({
      ...finding,
      profile: null,
      rationale: null,
      evidence: null,
      source: 'gpt',
    });
    const key = buildHybridFindingKey(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(normalized);
    }
  }

  for (const finding of input.localFindings) {
    const normalized = normalizeHybridMergedFinding({
      ...finding,
      source: 'local',
    });
    const key = buildHybridFindingKey(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(normalized);
    }
  }

  return unique.sort((left, right) => {
    const severityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    } as const;
    const severityDelta =
      severityOrder[left.severity] - severityOrder[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    const fileDelta = (left.file_path ?? '').localeCompare(
      right.file_path ?? '',
    );
    if (fileDelta !== 0) {
      return fileDelta;
    }

    const lineDelta = (left.line ?? 0) - (right.line ?? 0);
    if (lineDelta !== 0) {
      return lineDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

function normalizeHybridMergedFinding(
  finding: LocalReviewFinding & { source: 'gpt' | 'local' },
): HybridMergedFinding {
  return {
    severity: finding.severity,
    title: finding.title.trim(),
    detail: finding.detail.trim(),
    file_path: finding.file_path?.trim() || null,
    line: finding.line ?? null,
    recommendation: finding.recommendation?.trim() || null,
    profile: finding.profile?.trim() || null,
    rationale: finding.rationale?.trim() || null,
    evidence: finding.evidence?.trim() || null,
    source: finding.source,
  };
}

function buildHybridFindingKey(finding: HybridMergedFinding): string {
  return JSON.stringify([
    finding.severity,
    finding.file_path,
    finding.line,
    finding.title.toLowerCase(),
    finding.detail.toLowerCase(),
  ]);
}

function getHybridEscalationReasons(input: {
  gptReview: HybridGptReview;
  heuristics: HybridHeuristics;
  localFindings: ReadonlyArray<LocalReviewFinding>;
  localReviewError: string | null;
}): string[] {
  const reasons: string[] = [];

  if (input.gptReview.overall_risk === 'high') {
    reasons.push('GPT reviewer marked the change high risk');
  }

  if (
    input.localFindings.some(
      (finding) =>
        finding.severity === 'critical' || finding.severity === 'high',
    )
  ) {
    reasons.push('local reviewer reported a critical/high finding');
  }

  if (input.heuristics.sensitive_categories.length > 0) {
    reasons.push(
      `sensitive area detected: ${Array.from(
        new Set(input.heuristics.sensitive_categories),
      ).join(', ')}`,
    );
  }

  if (input.localReviewError) {
    reasons.push(`local runtime failure: ${input.localReviewError}`);
  }

  return reasons;
}

function resolveHybridDecisionBasis(input: {
  gptReview: HybridGptReview;
  localMode: HybridLocalMode;
  localReview: LocalReviewReport | null;
  localReviewError: string | null;
}): HybridDecisionBasis {
  if (input.gptReview.status !== 'completed' || input.localReviewError) {
    return 'local-fallback';
  }

  if (input.localMode !== 'skipped' || input.localReview) {
    return 'gpt+local';
  }

  return 'gpt';
}
