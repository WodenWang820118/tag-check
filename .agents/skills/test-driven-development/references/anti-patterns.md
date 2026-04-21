# TDD Anti-Patterns and Red Flags

This document lists common ways that the Test-Driven Development process can be misunderstood or misapplied. Watch out for these patterns and rationalizations.

## The Liar

- **Symptom:** A test that passes regardless of the code's state. It provides a false sense of security.
- **Example:** A test that checks if a list `is not None` when it should be checking if the list `is empty`.
- **How to Avoid:** Always watch your test fail first. If you cannot make it fail, it is not a real test.

## The Giant

- **Symptom:** A single test case that tries to assert too many things. When it fails, the failure story is muddy.
- **Example:** One test that checks the returned data, side effects, permissions, timestamps, and UI state all at once.
- **How to Avoid:** Give each test one main reason to fail.

## The Sloth

- **Symptom:** A test suite that is so slow developers stop running it.
- **Example:** Treating slow browser or integration tests as the default for every small logic change.
- **How to Avoid:** Follow the testing pyramid and keep most TDD cycles at the fastest useful layer.

## The Mimic

- **Symptom:** A test mirrors the implementation so tightly that refactoring breaks the test even when behavior is unchanged.
- **Example:** Mocking private helper order instead of testing the public contract.
- **How to Avoid:** Test observable behavior, not the private choreography.

## The Rationalizer

- **"I don't have time to write tests."**
  - The time comes back quickly in reduced debugging and less regression work.
- **"This code is too simple to need a test."**
  - If it is truly simple, the test should also be simple.
- **"I'm not sure what the design should be yet."**
  - That is exactly when TDD helps by forcing the public behavior to be explicit.
- **"I'll write the tests later."**
  - Later usually means never.

## The Premature Victory

- **Symptom:** Declaring a change done because one narrow test passed or because the code "looks right."
- **Example:** Adding a single happy-path unit test, skipping the edge case that motivated the fix, then using that pass as sign-off evidence.
- **How to Avoid:** Ask what evidence is still missing. If the changed behavior can still fail in an obvious way, the checkpoint is not closed yet.
