# ng-tag-build Responsive UI/UX Refactor

Status: complete
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

### Stage 1 follow-up (discovered during stage 6 QA)

The first stage 1 attempt imported Tailwind from `styles.scss`. Sass inlined
the `@import "tailwindcss/..."` statements before `@tailwindcss/postcss`
could see them, so the JIT scanner never ran and **no responsive variants
(`md:`, `lg:`, `xl:`) were emitted into the bundle** despite the utilities
appearing in templates. Compiled `styles.css` contained zero
`@media (min-width: ...)` rules from Tailwind.

Fix:

- Tailwind directives now live in a dedicated **pure CSS** entrypoint
  `apps/ng-tag-build/src/tailwind.css` so PostCSS sees them untouched. The
  file declares `@layer theme, base, components, utilities;` and uses
  `@source` directives to scan `libs/ui/src/**` and
  `apps/ng-tag-build/src/**`.
- `apps/ng-tag-build/src/styles.scss` is reduced to a stub pointing at the
  sibling tailwind entrypoint.
- `apps/ng-tag-build/project.json` lists both files in `styles`.

A second cascade conflict surfaced after that: Angular Material's baseline
component styles are emitted **unlayered** from two places — the prebuilt
theme `@angular/material/prebuilt-themes/indigo-pink.css` _and_ the
`@include mat.all-component-themes(theme.$primary-theme)` inside
`libs/shared-styles/src/styles/_styles.scss`. Per CSS Cascade L5, unlayered
rules beat layered ones at equal specificity, so Tailwind utilities inside
`@layer utilities` (e.g. `.lg\:hidden`) lose to Material defaults like
`.mat-mdc-icon-button { display: inline-block }`. Wrapping a single source
in `@layer material` is defeated by the other source's unlayered duplicates,
and refactoring `libs/shared-styles` is out of scope for this branch.

Practical workaround used in `MenuTabsComponent`: Tailwind v4's trailing
`!` important suffix (`hidden! lg:flex!`, `lg:hidden!`) on the toggles that
must override Material baselines. Component-scoped helpers like the inline
`.hidden { display: none }` previously in MenuTabsComponent were removed
because Angular ViewEncapsulation bumps their specificity above Tailwind's
single-class utility selectors.

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
