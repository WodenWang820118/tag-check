# Copilot Bridge Instructions

`AGENTS.md` is the canonical repository instruction file. Follow it first, then
load only the workflow, skill, and review files it names for the active task.
This bridge is an entry point only; it must not redefine workflow, provider
routing, gate conditions, or review lifecycle rules.

## First Reads

- Read `AGENTS.md` before other repo instructions.
- Project skills live in `.agents/skills`; the shared review contract lives in `.agents/reviewers/common-review-contract.toml`; workflow rules live in `.agents/workflows`.
- For review checkpoints, apply the shared contract together with the relevant tool-native reviewer profile or prompt named by `AGENTS.md`.
- Use repo review wrappers such as `pnpm review:*` only as directed by `AGENTS.md` and its referenced workflows.

## Repo Memory

- If a Copilot environment exposes a compatible memory tool and repo-relative `memories/repo/` files exist, load only the relevant files on demand. Treat missing memory support or a missing `memories/repo/` directory as non-blocking.
- Only write repo memory when the user explicitly asks to record a stable repo fact. Keep entries concise and do not duplicate `AGENTS.md` or `.agents/references/`.

## Boundaries

- Do not recreate `.github/skills` or `.gemini/skills` copies unless a tool proves it cannot read `.agents/skills`.
- Run workspace tasks through `pnpm nx ...` after loading the Nx guidance named by `AGENTS.md`.
- For Angular, NestJS, and Tauri tasks, load the matching file under `.agents/references/stack-conventions/` only through the load path in `AGENTS.md`.
- For browser-verifiable proof requests, follow the proofshot workflow named by `AGENTS.md`.
