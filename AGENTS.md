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

## Glossary

The UI, the API and the entities use different words for the same things.

| UI               | Code                                                            | Meaning                                                                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project          | `ProjectEntity`, `projectSlug`                                  | One website under test, with its settings: website URL, pre-loading values, GTM preview URL, authentication, browser.                                                                                                                                                                            |
| Test             | test event: `TestEventEntity`, `eventId`                        | One GA4 event to check. Owns a Chrome Recorder **recording** (the journey to replay), a **spec** (`SpecEntity`, the expected `dataLayer` push) and an optional item definition (`ItemDefEntity`).                                                                                                |
| Run              | inspection: `inspectSingleEvent`, `singleEventInspectionRecipe` | One replay of a test in Puppeteer. Makes two checks: the **dataLayer check** (`passed`) and the **request check** (`requestPassed`: a GA4 `/g/collect` request for the event, sent to the measurement ID).                                                                                       |
| Result           | `TestEventDetailEntity`                                         | One row per run with both check results, the raw request, the captured `dataLayer`, the message and the run's screenshot (`testImage`; null for older runs). `TestEventEntity.latestTestEventDetailId` points at the latest.                                                                     |
| Media            | `TestImageEntity`, `recording.webm`                             | The run's screenshot (one row per run; the API serves the latest) and its screen recording (`inspection_results/<eventId>/recording.webm`, replaced by every run; accompanied-mode runs also record the Tag Assistant tab to `recording-tag-assistant.webm`, served with `?view=tag-assistant`). |
| Report           | `IReportDetails`; `reports`, `file-reports` controllers         | A test's Reports tab, the Reports page (one row per run; deleting rows deletes runs and their screenshots, not tests) and the spreadsheet export. `GET /reports/:projectSlug` flattens each test's latest result into `passed`, `requestPassed`, `hasRecording` and `lastRunAt`.                 |
| Status           | `getRunStatus` (`report-detail.contracts.ts`)                   | Not run / Passed / Partial / Failed. A test has run when `lastRunAt` is set (null once every run is deleted).                                                                                                                                                                                    |
| Accompanied mode | `gtm-operator`                                                  | Runs a test through GTM Preview (Tag Assistant) instead of opening the site directly.                                                                                                                                                                                                            |

## How a run flows

```text
ng-frontend   Tests page: run-test-<event>
              TestRunningFacadeService.chooseAndRunTest
                accompanied mode  POST /datalayer/gtm-operator/:projectSlug/:eventId
                otherwise         POST /datalayer/:projectSlug/:eventId
nest-backend  controllers/gtm-operator      -> features/gtm-operator (opens GTM Preview first)
              controllers/data-layer        -> features/event-inspection (SingleEventInspectionService)
              features/web-agent/puppeteer-utils: browser, pre-loading values, screen recorder
              features/event-inspection-pipeline: singleEventInspectionRecipe
                features/inspector       replays the recording (features/web-agent), validates
                                         the dataLayer against the spec
                web-agent/action/request-interceptor  captures GA4 requests (CDP Fetch)
                features/request-processor            parses /g/collect payloads
              core/repository: TestEventDetail and TestImage rows; recording.webm on disk
              core/events-gateway: progressUpdate over SSE (GET /events, opened during a run)
ng-frontend   the run's HTTP response updates the table row; the report page loads
              GET /reports/:projectSlug/:eventId, /videos/..., /projects/images/...
```

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
inspection run, belongs in `features/`.

`OsModule` (`infrastructure/os/os.module.ts`) is the single module features
import for data access: it brings the infrastructure services and re-exports
`RepositoryModule`, which gathers every repository module. A feature module
imports `OsModule` rather than `RepositoryModule` or individual repository or
infrastructure modules.

Every module lists only its own services in `providers` and imports the
module that provides any other: a second provider creates a second instance.
`ProjectAgentModule` gathers the project modules and provides nothing itself.

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
- `any`, non-null assertions (`x!`) and unused variables are lint errors
  everywhere, specs and `tools/scripts` included. Narrow or guard values
  instead of asserting them.
- `data-testid` hooks are kebab-case, area first, with the GA4 event name or
  project slug as the per-row suffix (`run-test-add_to_cart`,
  `project-open-<slug>`).
- Test frontend code that reads an API response with the JSON the endpoint
  returns (dates are strings), not a hand-built object cast to the type. A
  mapper once read a nested field the API never sent, and its specs still
  passed.

## Pitfalls

- In Git Bash on Windows, unset `NX_WORKSPACE_ROOT_PATH` when its drive-letter
  case differs from the shell's working directory. The `@analogjs` Angular test
  setup fails otherwise.
- The SQLite schema comes from migrations
  (`apps/nest-backend/src/core/database/migrations`), not `synchronize`.
  Change an entity together with a new migration listed in
  `DATABASE_MIGRATIONS`; `database-migrations.spec.ts` fails while they
  disagree, and its `pendingSchemaChanges` gives the SQL to start from. A
  database created before migrations is synchronized once on its first start
  and every migration is recorded as applied, so a migration's data changes
  never run on it.
- The nest-backend bundle targets ES5 (rspack + swc without `jsc.target`).
  Functions passed to `page.evaluate` or `evaluateOnNewDocument` are compiled
  with swc helpers that do not exist in the page, so pass source strings.
  Raising the target breaks TypeORM entity initialization.
- Angular 22 does not sanitize `img`, `source` or `video` `src`. Bind `blob:`
  URLs as plain strings; a `SafeUrl` from `bypassSecurityTrustUrl` is rendered
  as the text "SafeValue must use [property]=binding".
- Desktop releases: see [docs/desktop-release.md](docs/desktop-release.md).
  Every code merge to `main` runs the release workflow; bump `VERSION` before
  a release merge. CI never packages the desktop app, so run
  `pnpm run tauri:release:windows` locally after dependency or tooling
  upgrades.
- pnpm (11 and 12) passes a `--` separator through to scripts. Run
  `pnpm run tauri:release describe`, not `pnpm run tauri:release -- describe`.
- Vercel deploys only `main` (`vercel.json`). Pull request previews come from
  `.github/workflows/vercel-previews.yaml`, which deploys the sites whose Nx
  project is affected. Register a new Vercel site in
  `tools/scripts/vercel/preview-targets`.
- ng-tag-build's initial bundle has about 12 kB of headroom under its 1 MB
  error budget, and `libs/shared-styles` counts against it. A dynamic import
  of a CommonJS package (such as exceljs) still adds the bundler's interop
  helpers to the initial bundle. Prefer
  `mat.*-overrides` mixins with only the tokens you change over
  `mat.*-color` / `mat.*-theme`.
- The pre-commit hook runs `nx affected` tests three at a time. At six,
  vitest workers ran out of memory (`DataCloneError: ... out of memory`) and
  timing-sensitive specs timed out. If a project fails only there but passes
  alone, retry the commit.
- Headful GTM runs (accompanied mode) leave their Chromium window open on
  purpose, for inspection. Close it yourself.
