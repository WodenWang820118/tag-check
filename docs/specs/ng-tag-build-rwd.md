# ng-tag-build Responsive UI/UX Refactor

Status: in progress
Owner: feat/ng-tag-build-rwd
Scope: `apps/ng-tag-build` and the `libs/ui` views/components it consumes.
Out of scope: `apps/ng-frontend`, `apps/ng-gtm-sample`, dark mode rework,
re-skinning Material theme, mobile <768 px optimization.

## Goal

Make https://tag-build.vercel.app/ comfortable to use on tablet (portrait),
laptop, and desktop without horizontal scroll, layout collisions, or wasted
space.

## Target breakpoints

| Token         | Min width | Reference device         |
| ------------- | --------- | ------------------------ |
| `$bp-pad`     | 768 px    | Tablet portrait          |
| `$bp-laptop`  | 1280 px   | Laptop                   |
| `$bp-desktop` | 1440 px   | Desktop / external panel |

Below `$bp-pad` the layout falls back to a single column (best-effort, not a
focus area for this slice).

## Design tokens (added in stage 0)

Added to `libs/shared-styles/src/styles/_variables.scss`:

- `$bp-pad`, `$bp-laptop`, `$bp-desktop` — RWD breakpoints
- `$container-max`: `1440px` — outer content max width
- `$content-max`: `1024px` — narrow text content (about/objectives)
- `$space-gutter`: `clamp(1rem, 2vw, 2rem)` — horizontal padding token
- `$space-block`: `clamp(1.5rem, 3vw, 3rem)` — vertical rhythm token

Existing `$screen-tablet1/2/3` variables stay untouched to avoid breaking
unrelated consumers; new code uses the new tokens. Mapping for future
migration: `$screen-tablet1` (768 px) ≡ `$bp-pad`; `$screen-tablet3`
(1240 px) is **not** equivalent to `$bp-laptop` (1280 px) — the legacy
1240 px boundary is intentionally retained for unrelated consumers and
should not be replaced as part of this work.

Anything below `$bp-pad` is treated as a single implicit "mobile" tier
(best-effort, not a focus of this refactor); a dedicated `$bp-mobile`
token is intentionally omitted to avoid hidden contracts.

## Layout decisions

### Tag Build workspace (primary view)

- Three columns on `$bp-laptop+` (Tailwind `xl`, ≥ 1280 px):
  - Left/Right editor panels: `flex: 1 1 0; min-width: 0` so they share
    available width.
  - Center actions: `clamp(18rem, 22%, 24rem)`.
- Below `$bp-laptop` (including 768 px tablet portrait): single
  stacked column — Input → Actions → Output. Splitting the editors
  side-by-side at 768 px would give each only ~360 px which is too
  narrow for JSON content. The actions panel sits between the editors
  so the logical "source → action → result" flow is consistent across
  every breakpoint.
- Outer `<main>` is `max-width: $container-max; margin-inline: auto`.

### Toolbar / nav

- ≥ `$bp-laptop`: tabs visible inline (current behavior).
- < `$bp-laptop`: collapse the menu links into a `MatMenu` triggered by an
  icon button. `lib-lang-select` collapses to icon-only at the same
  breakpoint.

### Footer

- Container padding switched from fixed `3rem 10rem` to
  `padding: $space-block $space-gutter`.

### Content pages (about / objectives)

- Replace `float: right` diagram with a CSS grid:
  `grid-template-columns: minmax(0, 1fr) minmax(0, 360px)` on `$bp-pad+`,
  single column below.
- Use `$content-max` for the text-heavy pages.

### AppComponent shell

- Replace hardcoded `.app { margin-top: 3rem; padding: 3rem 3rem }` with a
  flex column that uses `min-height: 100dvh` and `padding-block` driven by
  `$space-block`. Horizontal padding is delegated to the inner views so the
  workspace can be near-full-width while content pages stay narrow.

## Tailwind pipeline finding (drives stage 1)

`apps/ng-tag-build` already uses Tailwind utility classes in
`tag-build-page.component.html` (`md:flex-row`, `lg:gap-8`, `xl:w-[54rem]`,
etc.) but the application's `styles` array in `apps/ng-tag-build/project.json`
does not import any Tailwind layer, so those utilities never reach the
production bundle. Stage 1 imports Tailwind into
`apps/ng-tag-build/src/styles.scss` so existing and future utilities work.

## Stages

0. Spec + design tokens.
1. Tailwind pipeline fix in `ng-tag-build`.
2. `tag-build-page` three-column RWD.
3. Toolbar + footer RWD (collapse to hamburger, fluid footer padding).
4. About + objectives RWD (CSS grid + token-driven max-width).
5. AppComponent vertical rhythm.
6. QA — `nx test ui`, `nx build ng-tag-build:production`, proofshot at
   768×1024, 1280×800, 1440×900.

Each stage ends with a commit and `pnpm review:implementation`.

## Verification artifacts

- `proofshot-artifacts/<timestamp>_ng-tag-build-rwd-<viewport>/` per
  breakpoint, captured against `nx serve ng-tag-build`.
- `pnpm nx build ng-tag-build:production` clean.
- `pnpm nx test ui --watch=false` green.

## Risks

- Tailwind v4 import may push the production bundle above the existing
  `initial` budget (`maximumWarning: 500kb`). If it warns, raise the warning
  threshold rather than removing utility usage.
- Toolbar hamburger collapse may break selectors used by
  `apps/ng-frontend-e2e` or `apps/ng-gtm-sample-e2e`. Verified to be
  unaffected because those e2e suites target other apps, not
  `ng-tag-build`. Re-grep before stage 3 to confirm.
- The repo-wide `font-size: 62.5%` reset is intentionally **not** changed;
  new SCSS uses `rem` consistent with that 10 px base.
