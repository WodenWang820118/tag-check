# Release Clean-Install Gate Retirement

- Change mode: delete + edit.
- Existing owner: `.github/workflows/release.yml` and `tools/publish-release.ts`.
- Delete candidates: clean-install evidence generation, fixture registry transport,
  attestation verification, protected release environments, and the unused
  runtime preflight target.
- New owner needed: no. The build candidate remains the source for publication.
- Verification floor: package/runtime tests, release manifest/checksum checks,
  consumer smoke, and publisher idempotency tests.

The release contract is intentionally reduced to synchronized version checks,
package consumer checks, runtime artifact construction, candidate packaging, and
idempotent GitHub Release/npm publication. The tradeoff is explicit: hosted
clean-install validation and real-provider corpus evidence are no longer release
gates.
