// Risk-classification constants for the checkpoint-review system.

/** Model used when Copilot CLI is selected without an explicit --model flag. */
export const DEFAULT_COPILOT_CLAUDE_MODEL = 'claude-sonnet-4.6';

/** Heading that marks the changed-files list in a review context block. */
export const CHANGED_FILES_HEADING = 'changed files:';

/** Max number of changed files that can qualify for a low-risk auto-review. */
export const LOW_RISK_MAX_CHANGED_FILES = 2;

/**
 * File paths that are part of the review-gate / agent-workflow control plane.
 * Any change touching these paths is always rated high-risk.
 */
export const REVIEW_CONTROL_PLANE_PATH_PATTERNS = [
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

/**
 * File path segments that indicate high-risk surface areas (auth, routes,
 * contracts, config, storage, network, serialization, permissions).
 */
export const HIGH_RISK_PATH_PATTERNS = [
  /(^|\/)(auth|security)(\/|\.|_|-)/i,
  /(^|\/)(route|routes|router|controller|dto|schema|contract|contracts|api)(\/|\.|_|-)/i,
  /(^|\/)(config|env|settings)(\/|\.|_|-)/i,
  /(^|\/)(cli|runner|command)(\/|\.|_|-)/i,
  /(^|\/)(io|store|storage|persist|persistence|repository)(\/|\.|_|-)/i,
  /(^|\/)(net|network|transport|client|upstream)(\/|\.|_|-)/i,
  /(^|\/)(serialization|serializer|serialize|payload)(\/|\.|_|-)/i,
  /(^|\/)(permission|policy|rbac|role|access-control)(\/|\.|_|-)/i
] as const;

/** File extensions / suffixes that are inherently low-risk (docs, styles). */
export const LOW_RISK_PATH_PATTERNS = [
  /\.md$/i,
  /\.(html|css|scss|less|svg|txt)$/i
] as const;

/** Keywords in the `--focus` value that force a high-risk rating. */
export const HIGH_RISK_FOCUS_PATTERNS = [
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

/** Keywords in `--focus` that block a low-risk rating (push to medium). */
export const LOW_RISK_FOCUS_BLOCK_PATTERNS = [
  /\bsecurity\b/i,
  /\bauth\b/i,
  /\btest(?:s|ing)?\b/i,
  /\barchitecture\b/i,
  /\bcontract\b/i,
  /\bapi\b/i,
  /\bschema\b/i,
  /\bmigration\b/i
] as const;

/**
 * Keywords anywhere in the combined context text (focus + full context body)
 * that force a high-risk rating.
 */
export const HIGH_RISK_CONTEXT_PATTERNS = [
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

/**
 * Keywords in the combined context that push a borderline review from low to
 * medium risk.
 */
export const MEDIUM_RISK_CONTEXT_PATTERNS = [
  /\brefactor\b/i,
  /\brollout\b/i,
  /\barchitecture\b/i,
  /\bstate machine\b/i,
  /\bmulti-file\b/i
] as const;
