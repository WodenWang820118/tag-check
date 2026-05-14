// Constants for the review-gate system.
import type {
  PrimaryFamily,
  SupportedReviewer,
  TaskSize
} from './contracts.ts';

/** How long (in ms) a review approval remains valid. */
export const REVIEW_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Matches bare Node invocations of the review-gate scripts so the hook
 * can recognize them as review-gate commands rather than mutating tool use.
 */
export const REVIEW_GATE_ENTRYPOINT_COMMAND_PATTERN =
  /^\s*node(?:\.exe)?(?:\s+--experimental-strip-types)?\s+(?:\.?[\\/])?(?:tools[\\/]scripts|scripts)[\\/]review-gate[\\/](approve-pre-implementation|status|reset)[\\/]\1\.ts(?:\s+.*)?\s*$/i;

/**
 * Matches the `pnpm review:<cmd>` alias form so the hook allows review-gate
 * package-manager aliases without flagging them as mutating.
 */
export const REVIEW_GATE_SCRIPT_ALIAS_PATTERN =
  /^\s*(?:(?:npm|pnpm|yarn|bun)\s+)?review:(approve-pre-implementation|status|reset)(?:\s+--(?:\s+.*)?)?\s*$/i;

/**
 * Shell constructs that indicate a command is composing multiple operations
 * and therefore should be treated as potentially mutating even if an
 * individual part looks read-only.
 */
export const RISKY_SHELL_SYNTAX_PATTERNS: RegExp[] = [
  />{1,2}\s*\S/,
  /<{1,2}\s*\S/,
  /&&|\|\||;|&|[\r\n]/,
  /\|(?!\|)/,
  /\$\(/,
  /`[^`]+`/,
  /\b(powershell|pwsh)\b.*\s-(EncodedCommand|enc|e)\b/i
];

/** Maps each supported reviewer to its AI family. */
export const REVIEWER_FAMILY: Readonly<
  Record<SupportedReviewer, PrimaryFamily>
> = {
  'copilot-claude': 'copilot',
  'gemini-2.5-pro': 'gemini',
  'codex-subagent': 'codex'
};

/** Default max-files limit per task size (null = no limit). */
export const DEFAULT_MAX_FILES_BY_SIZE: Readonly<
  Record<TaskSize, number | null>
> = {
  tiny: 1,
  small: 2,
  medium: 5,
  large: 10,
  huge: null
};
