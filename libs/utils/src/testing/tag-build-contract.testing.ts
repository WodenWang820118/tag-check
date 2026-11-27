import {
  isTagConfig,
  isTriggerConfig
} from '../lib/functions/tag-build-contract';
import type { Spec } from '../lib/types/tag-check';

/**
 * Whether a value is a tag with the triggers that fire it. Production code
 * builds specs through typed constructors; tests use this guard to check the
 * shape those constructors return.
 */
export function isSpec(value: unknown): value is Spec {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    isTagConfig((value as Record<string, unknown>)['tag']) &&
    Array.isArray((value as Record<string, unknown>)['trigger']) &&
    ((value as Record<string, unknown>)['trigger'] as unknown[]).every(
      isTriggerConfig
    )
  );
}
