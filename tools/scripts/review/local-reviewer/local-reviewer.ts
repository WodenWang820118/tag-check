import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { availableParallelism, cpus } from 'node:os';

import {
  analyzeHybridHeuristics,
  buildHybridPrefilterContext,
  buildHybridReviewReport,
  createHybridGptBypassReview,
  buildPrefilterFailureContext,
  collectRepoCommitCandidates,
  collectChangedFiles,
  collectDiffText,
  collectEvaluationSamples,
  createLocalReviewerDependencies,
  createLocalReviewerEnv,
  DEFAULT_EVALUATION_AB_SAMPLE_COUNT,
  DEFAULT_EVALUATION_ROUNDS,
  MAX_HYBRID_GPT_DIFF_CHARS,
  DEFAULT_SAMPLE_SEED,
  DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
  ensureLocalReviewerBuild,
  evaluateSampleWithCheckpointReview,
  evaluateSampleWithLocalReviewer,
  getEscalationReasons,
  planHybridLocalReview,
  resolveEvaluationRepoTargets,
  resolveLocalReviewerRepoRoot,
  runHybridGptReview,
  runLocalReviewerDoctor,
  runLocalReviewerReview,
  selectAbSamples,
  selectEvaluationSamples,
  selectPaidReviewContext,
  summarizeEvaluation,
  type EvaluationLocalResult,
  type EvaluationSample,
  type HybridDecisionBasis,
  type HybridGptReview,
  type HybridLocalMode,
  type HybridLocalReviewResult,
  type HybridReviewProfileName,
  type HybridReviewReport,
  writePrefilterArtifacts
} from '../local-reviewer-support/local-reviewer-support.ts';

type LocalReviewerCommand = 'doctor' | 'evaluate' | 'prefilter' | 'staged';

export interface ParsedLocalReviewerCliArgs {
  abSamples: number;
  command: LocalReviewerCommand;
  jobs: number;
  repos: string[];
  rounds: number;
  seed: number;
  smallDiffThresholdChars: number;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  if (argv[0] === '__collect-candidates') {
    await runCollectCandidatesWorker(argv.slice(1));
    return;
  }

  if (argv[0] === '__evaluate-sample') {
    await runEvaluateSampleWorker(argv.slice(1));
    return;
  }

  if (argv[0] === '__hybrid-gpt-review') {
    await runHybridGptWorker(argv.slice(1));
    return;
  }

  if (argv[0] === '__hybrid-local-review') {
    await runHybridLocalWorker(argv.slice(1));
    return;
  }

  const parsed = parseCliArgs(argv);
  const repoRoot = process.cwd();
  const dependencies = createLocalReviewerDependencies();
  const toolRepoRoot = resolveLocalReviewerRepoRoot(repoRoot);
  const env = createLocalReviewerEnv();
  const jobs = normalizeJobs(parsed.jobs);

  ensureLocalReviewerBuild(toolRepoRoot, dependencies, env);

  if (parsed.command === 'doctor') {
    const report = runLocalReviewerDoctor({
      dependencies,
      env,
      targetRepoRoot: repoRoot,
      toolRepoRoot
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (parsed.command === 'staged') {
    const diffText = collectDiffText({
      dependencies,
      repoRoot,
      staged: true
    });
    const changedFiles = collectChangedFiles({
      dependencies,
      repoRoot,
      staged: true
    });
    const report = await runHybridStagedReview({
      changedFiles,
      diffText,
      repoRoot,
      scriptPath: resolveScriptPath(),
      toolRepoRoot
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (parsed.command === 'prefilter') {
    const diffText = collectDiffText({
      dependencies,
      repoRoot,
      staged: true
    });
    const changedFiles = collectChangedFiles({
      dependencies,
      repoRoot,
      staged: true
    });

    try {
      const report = await runHybridStagedReview({
        changedFiles,
        diffText,
        repoRoot,
        scriptPath: resolveScriptPath(),
        toolRepoRoot
      });
      const contextMarkdown = buildHybridPrefilterContext({
        report
      });
      const reviewContextSelection = selectPaidReviewContext({
        diffText,
        prefilterContext: contextMarkdown,
        smallDiffThresholdChars: parsed.smallDiffThresholdChars
      });
      const payload = {
        recommended_escalation: report.recommended_escalation,
        escalation_reasons: report.escalation_reasons,
        gpt_provider: report.gpt_review.provider,
        gpt_risk: report.gpt_review.overall_risk,
        gpt_confidence: report.gpt_review.confidence,
        local_mode: report.local_mode,
        requested_profiles: report.requested_profiles,
        decision_basis: report.decision_basis,
        report,
        review_context_mode: reviewContextSelection.mode,
        small_diff_threshold_chars:
          reviewContextSelection.smallDiffThresholdChars
      };
      const artifacts = writePrefilterArtifacts({
        repoRoot,
        contextMarkdown,
        reportPayload: payload,
        reviewContextSelection
      });

      writePrefilterOutput({
        artifacts,
        decisionBasis: report.decision_basis,
        gptConfidence: report.gpt_review.confidence,
        gptProvider: report.gpt_review.provider,
        gptRisk: report.gpt_review.overall_risk,
        localMode: report.local_mode,
        payload,
        recommendedEscalation: report.recommended_escalation,
        requestedProfiles: report.requested_profiles,
        reviewContextMode: reviewContextSelection.mode,
        smallDiffThresholdChars: reviewContextSelection.smallDiffThresholdChars
      });
      return;
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      const escalationReasons = getEscalationReasons({
        diffText,
        fileCount: changedFiles.length,
        findings: [],
        changedFiles,
        localReviewError: errorText
      });
      const contextMarkdown = buildPrefilterFailureContext({
        changedFiles,
        diffText,
        escalationReasons,
        localReviewError: errorText
      });
      const reviewContextSelection = selectPaidReviewContext({
        diffText,
        forceFullDiff: true,
        prefilterContext: contextMarkdown,
        smallDiffThresholdChars: parsed.smallDiffThresholdChars
      });
      const payload = {
        recommended_escalation: true,
        escalation_reasons: escalationReasons,
        gpt_provider: 'copilot-gpt-5-mini',
        gpt_risk: null,
        gpt_confidence: null,
        local_mode: 'full',
        requested_profiles: [],
        decision_basis: 'local-fallback',
        local_review_error: errorText,
        report: null,
        review_context_mode: reviewContextSelection.mode,
        small_diff_threshold_chars:
          reviewContextSelection.smallDiffThresholdChars
      };
      const artifacts = writePrefilterArtifacts({
        repoRoot,
        contextMarkdown,
        reportPayload: payload,
        reviewContextSelection
      });

      writePrefilterOutput({
        artifacts,
        decisionBasis: 'local-fallback',
        gptConfidence: null,
        gptProvider: 'copilot-gpt-5-mini',
        gptRisk: null,
        localMode: 'full',
        payload,
        recommendedEscalation: true,
        requestedProfiles: [],
        reviewContextMode: reviewContextSelection.mode,
        smallDiffThresholdChars: reviewContextSelection.smallDiffThresholdChars
      });
      return;
    }
  }

  const repoTargets = resolveEvaluationRepoTargets(repoRoot, parsed.repos);
  const samples =
    jobs > 1
      ? await collectEvaluationSamplesInParallel({
          dependencies,
          jobs,
          repoTargets,
          rounds: parsed.rounds,
          scriptPath: resolveScriptPath(),
          seed: parsed.seed
        })
      : collectEvaluationSamples({
          dependencies,
          repoTargets,
          rounds: parsed.rounds,
          seed: parsed.seed
        });
  const localResults =
    jobs > 1
      ? await evaluateSamplesInParallel({
          jobs,
          samples,
          scriptPath: resolveScriptPath(),
          smallDiffThresholdChars: parsed.smallDiffThresholdChars,
          toolRepoRoot
        })
      : samples.map((sample) =>
          evaluateSampleWithLocalReviewer({
            dependencies,
            env,
            sample,
            smallDiffThresholdChars: parsed.smallDiffThresholdChars,
            toolRepoRoot
          })
        );
  const abSamples = selectAbSamples(samples, parsed.abSamples);
  const reviewerResults =
    parsed.abSamples > 0
      ? abSamples.map((sample) =>
          evaluateSampleWithCheckpointReview({
            dependencies,
            sample
          })
        )
      : [];
  const output = summarizeEvaluation({
    config: {
      abSampleCount: parsed.abSamples,
      jobs,
      repoNames: repoTargets.map((repo) => repo.name),
      rounds: parsed.rounds,
      seed: parsed.seed,
      smallDiffThresholdChars: parsed.smallDiffThresholdChars
    },
    localResults,
    reviewerResults,
    repoRoot
  });

  process.stdout.write(`${output.summaryMarkdown}\n`);
  process.stdout.write(
    [
      '',
      `samples_path=${output.artifacts.samplesPath}`,
      `local_results_path=${output.artifacts.localResultsPath}`,
      `ab_results_path=${output.artifacts.abResultsPath}`,
      `summary_path=${output.artifacts.summaryPath}`
    ].join('\n')
  );
  process.stdout.write('\n');
}

export function parseCliArgs(
  argv: string[] = process.argv.slice(2)
): ParsedLocalReviewerCliArgs {
  const command = parseCommand(argv[0]);
  const parsed: ParsedLocalReviewerCliArgs = {
    abSamples: DEFAULT_EVALUATION_AB_SAMPLE_COUNT,
    command,
    jobs: getDefaultEvaluationJobs(),
    repos: [],
    rounds: DEFAULT_EVALUATION_ROUNDS,
    seed: DEFAULT_SAMPLE_SEED,
    smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS
  };

  for (let index = 1; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--rounds') {
      parsed.rounds = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--seed') {
      parsed.seed = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--small-diff-threshold-chars') {
      parsed.smallDiffThresholdChars = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--ab-samples') {
      parsed.abSamples = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--jobs') {
      parsed.jobs = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--repo') {
      parsed.repos.push(readStringFlag(argv, index, current));
      index += 1;
      continue;
    }

    throw new Error(`${getUsageText()}\n\nUnknown flag: ${current}`);
  }

  return parsed;
}

export function getUsageText(scriptName = 'local-reviewer.ts'): string {
  return [
    `Usage: node --experimental-strip-types ${scriptName} <doctor|staged|prefilter|evaluate> [options]`,
    '',
    'Options:',
    `  --small-diff-threshold-chars <n>  Override the small diff cutoff (default: ${DEFAULT_SMALL_DIFF_THRESHOLD_CHARS})`,
    `  --rounds <n>                      Evaluation rounds for \`evaluate\` (default: ${DEFAULT_EVALUATION_ROUNDS})`,
    `  --seed <n>                        Deterministic sample seed for \`evaluate\` (default: ${DEFAULT_SAMPLE_SEED})`,
    `  --ab-samples <n>                  Optional paid-review A/B sample count for \`evaluate\` (default: ${DEFAULT_EVALUATION_AB_SAMPLE_COUNT})`,
    `  --jobs <n>                        Local parallel worker count for \`evaluate\` (default: ${getDefaultEvaluationJobs()})`,
    '  --repo <path-or-name>             Additional evaluation repo target; repeatable'
  ].join('\n');
}

export function writePrefilterOutput(input: {
  artifacts: {
    contextPath: string;
    reportPath: string;
    reviewContextPath: string;
  };
  decisionBasis: HybridDecisionBasis;
  gptConfidence: HybridGptReview['confidence'];
  gptProvider: HybridGptReview['provider'];
  gptRisk: HybridGptReview['overall_risk'];
  localMode: HybridLocalMode;
  payload: Record<string, unknown>;
  recommendedEscalation: boolean;
  requestedProfiles: ReadonlyArray<HybridReviewProfileName>;
  reviewContextMode: string;
  smallDiffThresholdChars: number;
}): void {
  process.stdout.write(
    [
      `recommended_escalation=${String(input.recommendedEscalation)}`,
      `report_path=${input.artifacts.reportPath}`,
      `context_path=${input.artifacts.contextPath}`,
      `review_context_path=${input.artifacts.reviewContextPath}`,
      `review_context_mode=${input.reviewContextMode}`,
      `gpt_provider=${input.gptProvider}`,
      `gpt_risk=${input.gptRisk ?? 'unknown'}`,
      `gpt_confidence=${input.gptConfidence ?? 'unknown'}`,
      `local_mode=${input.localMode}`,
      `requested_profiles=${
        input.requestedProfiles.length > 0
          ? input.requestedProfiles.join(',')
          : 'none'
      }`,
      `decision_basis=${input.decisionBasis}`,
      `small_diff_threshold_chars=${input.smallDiffThresholdChars}`,
      '',
      JSON.stringify(input.payload, null, 2)
    ].join('\n')
  );
  process.stdout.write('\n');
}

async function runHybridStagedReview(input: {
  changedFiles: string[];
  diffText: string;
  repoRoot: string;
  scriptPath: string;
  toolRepoRoot: string;
}): Promise<HybridReviewReport> {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: input.changedFiles,
    diffText: input.diffText
  });

  if (heuristics.file_count === 0 && input.diffText.trim().length === 0) {
    return buildHybridReviewReport({
      gptReview: {
        provider: 'copilot-gpt-5-mini',
        model: 'gpt-5-mini',
        status: 'completed',
        overall_risk: 'low',
        confidence: 'high',
        needs_local_deep_review: false,
        focus_profiles: [],
        findings: [],
        summary: 'No staged changes were detected.',
        error: null
      },
      heuristics,
      localReviewResult: null
    });
  }

  const forceFullLocal =
    heuristics.sensitive_categories.length > 0 ||
    heuristics.file_count > 15 ||
    input.diffText.length > MAX_HYBRID_GPT_DIFF_CHARS;
  const gptPromise =
    input.diffText.length > MAX_HYBRID_GPT_DIFF_CHARS
      ? Promise.resolve(
          createHybridGptBypassReview(
            `Skipped cloud GPT review because the diff exceeded the safe prompt budget (${input.diffText.length} > ${MAX_HYBRID_GPT_DIFF_CHARS} chars).`
          )
        )
      : runHybridGptWorkerProcess({
          changedFiles: heuristics.changed_files,
          diffText: input.diffText,
          repoRoot: input.repoRoot,
          scriptPath: input.scriptPath
        });
  const earlyLocalPromise = forceFullLocal
    ? runHybridLocalWorkerProcess({
        localMode: 'full',
        repoRoot: input.repoRoot,
        requestedProfiles: heuristics.routed_profiles,
        scriptPath: input.scriptPath,
        toolRepoRoot: input.toolRepoRoot
      })
    : null;
  const gptReview = await gptPromise;
  const localPlan = planHybridLocalReview({
    gptReview,
    heuristics
  });

  const localReviewResult =
    earlyLocalPromise !== null
      ? await earlyLocalPromise
      : localPlan.local_mode !== 'skipped'
        ? await runHybridLocalWorkerProcess({
            localMode: localPlan.local_mode,
            repoRoot: input.repoRoot,
            requestedProfiles: localPlan.requested_profiles,
            scriptPath: input.scriptPath,
            toolRepoRoot: input.toolRepoRoot
          })
        : null;

  return buildHybridReviewReport({
    gptReview,
    heuristics,
    localReviewResult
  });
}

async function runHybridGptWorkerProcess(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
  repoRoot: string;
  scriptPath: string;
}): Promise<HybridGptReview> {
  return runJsonWorker<HybridGptReview>({
    args: [
      '__hybrid-gpt-review',
      '--changed-files-base64',
      Buffer.from(JSON.stringify(input.changedFiles), 'utf8').toString(
        'base64'
      ),
      '--diff-base64',
      Buffer.from(input.diffText, 'utf8').toString('base64')
    ],
    cwd: input.repoRoot,
    scriptPath: input.scriptPath
  });
}

async function runHybridLocalWorkerProcess(input: {
  localMode: Exclude<HybridLocalMode, 'skipped'>;
  repoRoot: string;
  requestedProfiles: ReadonlyArray<HybridReviewProfileName>;
  scriptPath: string;
  toolRepoRoot: string;
}): Promise<HybridLocalReviewResult> {
  return runJsonWorker<HybridLocalReviewResult>({
    args: [
      '__hybrid-local-review',
      '--local-mode',
      input.localMode,
      '--requested-profiles',
      input.requestedProfiles.join(','),
      '--tool-repo-root',
      input.toolRepoRoot
    ],
    cwd: input.repoRoot,
    scriptPath: input.scriptPath
  });
}

function parseCommand(rawValue?: string): LocalReviewerCommand {
  if (
    rawValue === 'doctor' ||
    rawValue === 'staged' ||
    rawValue === 'prefilter' ||
    rawValue === 'evaluate'
  ) {
    return rawValue;
  }

  throw new Error(getUsageText(resolveUsageScriptName()));
}

function readIntegerFlag(argv: string[], index: number, flag: string): number {
  const rawValue = argv[index + 1];
  if (!rawValue) {
    throw new Error(`${getUsageText()}\n\nMissing value for ${flag}.`);
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} requires a non-negative integer.`);
  }

  return parsed;
}

function readStringFlag(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${getUsageText()}\n\nMissing value for ${flag}.`);
  }

  return value;
}

function resolveUsageScriptName(): string {
  return basename(process.argv[1] ?? 'local-reviewer.ts');
}

function getDefaultEvaluationJobs(): number {
  try {
    return Math.max(1, Math.min(4, availableParallelism()));
  } catch {
    return Math.max(1, Math.min(4, cpus().length || 1));
  }
}

function normalizeJobs(jobs: number): number {
  return Math.max(1, jobs);
}

async function collectEvaluationSamplesInParallel(input: {
  dependencies: ReturnType<typeof createLocalReviewerDependencies>;
  jobs: number;
  repoTargets: ReturnType<typeof resolveEvaluationRepoTargets>;
  rounds: number;
  scriptPath: string;
  seed: number;
}): Promise<EvaluationSample[]> {
  const candidates = (
    await mapLimit(input.repoTargets, input.jobs, (repoTarget, index) =>
      runJsonWorker<EvaluationSample[]>({
        args: [
          '__collect-candidates',
          '--repo-name',
          repoTarget.name,
          '--repo-root',
          repoTarget.root,
          '--seed',
          String(input.seed + index + 1)
        ],
        cwd: process.cwd(),
        scriptPath: input.scriptPath
      })
    )
  ).flat();

  return selectEvaluationSamples({
    candidates,
    rounds: input.rounds,
    seed: input.seed
  });
}

async function evaluateSamplesInParallel(input: {
  jobs: number;
  samples: ReadonlyArray<EvaluationSample>;
  scriptPath: string;
  smallDiffThresholdChars: number;
  toolRepoRoot: string;
}): Promise<EvaluationLocalResult[]> {
  return mapLimit(input.samples, input.jobs, (sample) =>
    runJsonWorker<EvaluationLocalResult>({
      args: [
        '__evaluate-sample',
        '--sample-base64',
        Buffer.from(JSON.stringify(sample), 'utf8').toString('base64'),
        '--small-diff-threshold-chars',
        String(input.smallDiffThresholdChars),
        '--tool-repo-root',
        input.toolRepoRoot
      ],
      cwd: process.cwd(),
      scriptPath: input.scriptPath
    })
  );
}

async function runCollectCandidatesWorker(argv: string[]): Promise<void> {
  const dependencies = createLocalReviewerDependencies();
  const parsed = parseCollectCandidatesArgs(argv);
  const payload = collectRepoCommitCandidates({
    dependencies,
    repoName: parsed.repoName,
    repoRoot: parsed.repoRoot,
    seed: parsed.seed
  });
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

async function runEvaluateSampleWorker(argv: string[]): Promise<void> {
  const parsed = parseEvaluateSampleArgs(argv);
  const dependencies = createLocalReviewerDependencies();
  const env = createLocalReviewerEnv();
  const payload = evaluateSampleWithLocalReviewer({
    dependencies,
    env,
    sample: JSON.parse(
      Buffer.from(parsed.sampleBase64, 'base64').toString('utf8')
    ) as EvaluationSample,
    smallDiffThresholdChars: parsed.smallDiffThresholdChars,
    toolRepoRoot: parsed.toolRepoRoot
  });
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

async function runHybridGptWorker(argv: string[]): Promise<void> {
  const parsed = parseHybridGptWorkerArgs(argv);
  const payload = runHybridGptReview({
    changedFiles: JSON.parse(
      Buffer.from(parsed.changedFilesBase64, 'base64').toString('utf8')
    ) as string[],
    diffText: Buffer.from(parsed.diffBase64, 'base64').toString('utf8'),
    repoRoot: process.cwd()
  });
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

async function runHybridLocalWorker(argv: string[]): Promise<void> {
  const parsed = parseHybridLocalWorkerArgs(argv);
  const dependencies = createLocalReviewerDependencies();
  const env = createLocalReviewerEnv();
  const requestedProfiles = parseRequestedProfiles(parsed.requestedProfiles);

  try {
    const report = runLocalReviewerReview({
      dependencies,
      env,
      requestedProfiles,
      staged: true,
      targetRepoRoot: process.cwd(),
      toolRepoRoot: parsed.toolRepoRoot
    });
    const payload: HybridLocalReviewResult = {
      local_mode: parsed.localMode,
      requested_profiles: requestedProfiles,
      report,
      error: null
    };
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  } catch (error) {
    const payload: HybridLocalReviewResult = {
      local_mode: parsed.localMode,
      requested_profiles: requestedProfiles,
      report: null,
      error: error instanceof Error ? error.message : String(error)
    };
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }
}

function parseCollectCandidatesArgs(argv: string[]): {
  repoName: string;
  repoRoot: string;
  seed: number;
} {
  const parsed = {
    repoName: '',
    repoRoot: '',
    seed: DEFAULT_SAMPLE_SEED
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--repo-name') {
      parsed.repoName = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--repo-root') {
      parsed.repoRoot = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--seed') {
      parsed.seed = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal worker flag: ${current}`);
  }

  if (!parsed.repoName || !parsed.repoRoot) {
    throw new Error('Missing required internal repo candidate worker args.');
  }

  return parsed;
}

function parseEvaluateSampleArgs(argv: string[]): {
  sampleBase64: string;
  smallDiffThresholdChars: number;
  toolRepoRoot: string;
} {
  const parsed = {
    sampleBase64: '',
    smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
    toolRepoRoot: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--sample-base64') {
      parsed.sampleBase64 = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--small-diff-threshold-chars') {
      parsed.smallDiffThresholdChars = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--tool-repo-root') {
      parsed.toolRepoRoot = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal worker flag: ${current}`);
  }

  if (!parsed.sampleBase64 || !parsed.toolRepoRoot) {
    throw new Error('Missing required internal sample worker args.');
  }

  return parsed;
}

function parseHybridGptWorkerArgs(argv: string[]): {
  changedFilesBase64: string;
  diffBase64: string;
} {
  const parsed = {
    changedFilesBase64: '',
    diffBase64: ''
  };
  let sawChangedFilesBase64 = false;
  let sawDiffBase64 = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--changed-files-base64') {
      parsed.changedFilesBase64 = readPossiblyEmptyStringFlag(
        argv,
        index,
        current
      );
      sawChangedFilesBase64 = true;
      index += 1;
      continue;
    }
    if (current === '--diff-base64') {
      parsed.diffBase64 = readPossiblyEmptyStringFlag(argv, index, current);
      sawDiffBase64 = true;
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal hybrid GPT worker flag: ${current}`);
  }

  if (!sawChangedFilesBase64 || !sawDiffBase64) {
    throw new Error('Missing required hybrid GPT worker args.');
  }

  return parsed;
}

function parseHybridLocalWorkerArgs(argv: string[]): {
  localMode: Exclude<HybridLocalMode, 'skipped'>;
  requestedProfiles: string;
  toolRepoRoot: string;
} {
  const parsed = {
    localMode: 'full' as Exclude<HybridLocalMode, 'skipped'>,
    requestedProfiles: '',
    toolRepoRoot: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--local-mode') {
      const rawValue = readStringFlag(argv, index, current);
      if (rawValue !== 'full' && rawValue !== 'targeted') {
        throw new Error(`Unsupported hybrid local mode: ${rawValue}`);
      }
      parsed.localMode = rawValue;
      index += 1;
      continue;
    }
    if (current === '--requested-profiles') {
      parsed.requestedProfiles = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--tool-repo-root') {
      parsed.toolRepoRoot = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal hybrid local worker flag: ${current}`);
  }

  if (!parsed.toolRepoRoot) {
    throw new Error('Missing required hybrid local worker args.');
  }

  return parsed;
}

function parseRequestedProfiles(
  requestedProfiles: string
): HybridReviewProfileName[] {
  const values = requestedProfiles
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.filter(
    (entry): entry is HybridReviewProfileName =>
      entry === 'angular' ||
      entry === 'nest' ||
      entry === 'typescript' ||
      entry === 'repo-habits' ||
      entry === 'general'
  );
}

function readPossiblyEmptyStringFlag(
  argv: string[],
  index: number,
  flag: string
): string {
  if (index + 1 >= argv.length) {
    throw new Error(`${getUsageText()}\n\nMissing value for ${flag}.`);
  }

  return argv[index + 1] ?? '';
}

async function runJsonWorker<T>(input: {
  args: string[];
  cwd: string;
  scriptPath: string;
}): Promise<T> {
  const result = await runNodeWorker({
    args: ['--experimental-strip-types', input.scriptPath, ...input.args],
    cwd: input.cwd
  });

  try {
    return JSON.parse(result.stdout) as T;
  } catch (error) {
    throw new Error(
      `Worker returned non-JSON output: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function runNodeWorker(input: {
  args: string[];
  cwd: string;
}): Promise<{ stderr: string; stdout: string }> {
  return new Promise((resolveResult, reject) => {
    const child = spawn('node', input.args, {
      cwd: input.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolveResult({
          stderr: stderr.trim(),
          stdout: stdout.trim()
        });
        return;
      }

      reject(
        new Error(
          stderr.trim() || stdout.trim() || `Worker exited with code ${code}.`
        )
      );
    });
  });
}

async function mapLimit<TItem, TResult>(
  items: ReadonlyArray<TItem>,
  limit: number,
  mapper: (item: TItem, index: number) => Promise<TResult>
): Promise<TResult[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<TResult>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(
          items[currentIndex]!,
          currentIndex
        );
      }
    })
  );

  return results;
}

function resolveScriptPath(): string {
  const scriptPath = process.argv[1];
  if (!scriptPath) {
    throw new Error('Unable to resolve the local-reviewer script path.');
  }

  return scriptPath;
}

const isEntryPoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
