<!-- nx configuration start -->

# Nx workspace guidance

- Use `pnpm nx` for project discovery and all build, lint, test, and packaging targets.
- Use `pnpm nx show project <name> --json` for resolved target configuration.
- Use Nx generators with `--dry-run` and `--no-interactive` before creating Angular projects.

<!-- nx configuration end -->

# TagCheck

TagCheck validates Google Tag Manager setups. It replays Chrome Recorder flows
in Puppeteer, captures `dataLayer` pushes and GA4 requests, and checks them
against specs built from a GTM container export. The project list is in
[README.md](README.md#workspace-topology).

## Boundaries

Every `project.json` has a `scope:*` and a `type:*` tag.
`@nx/enforce-module-boundaries` in `.oxlintrc.json` enforces them:

- `scope:frontend` and `scope:backend` depend only on their own scope and
  `scope:shared` (`libs/utils`). The backend never imports Angular libraries.
- `type:app` and `type:feature` depend on feature, ui, data-access and util
  libraries; `type:ui` on ui and util; `type:data-access` on data-access and
  util; `type:util` on util only; `type:e2e` on util only.
- `libs/ui` is tagged `type:feature`: it holds routed views and injects
  `@data-access` services, not only presentational components.

Inside `apps/nest-backend/src`, imports point down:
`controllers -> features -> infrastructure -> core -> shared`. A
`no-restricted-imports` override stops `infrastructure`, `core` and `shared`
from importing upward. Code that drives features, such as the Puppeteer
inspection run, belongs in `features/`. Import the module that provides a
service; don't rely on another module re-exporting it.

## Conventions

- GA4 event names, parameters and ecommerce rules follow Google's
  documentation, cited where they are used
  (`libs/utils/src/lib/functions/ga4-reference.ts`). Google does not document
  the `/g/collect` wire format; code that parses it says it was recorded from
  gtag.js.
- The example project's recordings
  (`apps/nest-backend/src/features/example-project/events`) click
  `data-testid` hooks on `ng-gtm-sample` and run against
  https://ng-gtm-sample.vercel.app. Keep those hooks stable or re-record.
- Lint with oxlint and format with oxfmt. The workspace has no ESLint.

## Pitfalls

- In Git Bash on Windows, unset `NX_WORKSPACE_ROOT_PATH` when its drive-letter
  case differs from the shell's working directory. The `@analogjs` Angular test
  setup fails otherwise.
