# Direct Release Publication V1

> Historical baseline. `v0.3-pre-release-closeout.md` and
> `release-model-artifact-provisioning.md` supersede its candidate contents and
> gates. The current tag workflow derives core-only versus model-enabled mode
> from the canonical checked-in source lock, requires successful exact-SHA main
> CI in both modes, and requires model receipt evidence only for non-empty
> model requirements.

## Purpose

Publish `@gx-capture/capture-workbench` and the Windows x64 `capture-runtime` assets
from one verified build candidate without a separate clean-install evidence
workflow.

## Contract

The tag workflow is:

```text
build-candidate -> publish
```

The candidate contains the runtime release directory and one package tarball.
The publish job has only `contents: write` and `packages: write` permissions and
uses `tools/publish-release.ts` for runtime-first, retry-safe publication.

## Non-goals

- No clean-install evidence or fixture registry.
- No GitHub artifact attestation gate.
- No release environment or evidence secret.
- No NSIS installer publication requirement.

## Acceptance Criteria

- The release workflow has exactly the `build-candidate` and `publish` jobs.
- `publish` depends directly on `build-candidate`.
- The candidate contains runtime assets and exactly one package tarball.
- Existing version, manifest, checksum, package, consumer, and publisher tests
  remain green.
