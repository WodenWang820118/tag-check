import { Injectable } from '@nestjs/common';
import {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
  ValidationResult
} from '@utils';
import { ValidationResultDto } from '../../../shared/dto/validation-result.dto';

/**
 * A Tag Manager variable such as `{{DLV - ecommerce.value}}`, only known at
 * runtime. With a single quantifier the pattern cannot backtrack
 * exponentially; a failed match is at worst quadratic in the length of the
 * value, and it only ever runs on the short strings of a spec.
 */
const GTM_VARIABLE_REFERENCE = /\{\{[^}]+\}\}/;

type Indexable = Record<string, unknown>;

/**
 * Compares an event against its spec, descending into nested objects such as
 * `ecommerce` and arrays such as `ecommerce.items`.
 *
 * Spec values:
 * - a number, boolean or plain string must equal the actual value;
 * - `/pattern/` must match the actual string value;
 * - `$name` or a Tag Manager variable reference only requires the key to exist;
 * - an object must be matched key by key;
 * - every entry of an array must match at least one actual entry, in any order.
 */
@Injectable()
export class DataLayerValidationUtilsService {
  validateKeyValues(
    dataLayerSpec: StrictDataLayerEvent,
    dataLayerObj: BaseDataLayerEvent | StrictDataLayerEvent
  ): ValidationResult {
    const mismatch = this.findObjectMismatch(
      dataLayerSpec as Indexable,
      dataLayerObj as Indexable,
      ''
    );
    if (mismatch) {
      return this.createValidationError(mismatch, dataLayerSpec, dataLayerObj);
    }
    return this.createPassedResult(dataLayerSpec, dataLayerObj);
  }

  /** Returns why `actual` does not satisfy `expected`, or null when it does. */
  private findObjectMismatch(
    expected: Indexable,
    actual: Indexable,
    path: string
  ): string | null {
    for (const key of Object.keys(expected)) {
      const keyPath = path ? `${path}.${key}` : key;
      if (!(key in actual)) {
        return `Key "${keyPath}" is missing in the data layer`;
      }
      const mismatch = this.findValueMismatch(
        expected[key],
        actual[key],
        keyPath
      );
      if (mismatch) {
        return mismatch;
      }
    }
    return null;
  }

  private findValueMismatch(
    expected: unknown,
    actual: unknown,
    path: string
  ): string | null {
    if (typeof expected === 'string') {
      return this.findStringMismatch(expected, actual, path);
    }
    if (typeof expected === 'number' || typeof expected === 'boolean') {
      return expected === actual
        ? null
        : `Value for key "${path}" does not match the expected value`;
    }
    if (Array.isArray(expected)) {
      return this.findArrayMismatch(expected, actual, path);
    }
    if (isPlainObject(expected)) {
      return isPlainObject(actual)
        ? this.findObjectMismatch(expected, actual, path)
        : `Value for key "${path}" is not an object as expected`;
    }
    return null;
  }

  private findStringMismatch(
    expected: string,
    actual: unknown,
    path: string
  ): string | null {
    if (expected.startsWith('$') || GTM_VARIABLE_REFERENCE.test(expected)) {
      return null;
    }
    if (
      expected.length > 1 &&
      expected.startsWith('/') &&
      expected.endsWith('/')
    ) {
      if (typeof actual !== 'string') {
        return `Value for key "${path}" is not a string as expected`;
      }
      let pattern: RegExp;
      try {
        pattern = new RegExp(expected.slice(1, -1));
      } catch {
        return `Spec for key "${path}" is not a valid regex pattern`;
      }
      return pattern.test(actual)
        ? null
        : `Value for key "${path}" does not match the regex pattern`;
    }
    return expected === actual
      ? null
      : `Value for key "${path}" does not match the expected value`;
  }

  private findArrayMismatch(
    expected: unknown[],
    actual: unknown,
    path: string
  ): string | null {
    if (!Array.isArray(actual)) {
      return `Value for key "${path}" is not an array as expected`;
    }
    for (const [index, expectedEntry] of expected.entries()) {
      const entryPath = `${path}[${index}]`;
      const mismatches = actual.map((actualEntry) =>
        this.findValueMismatch(expectedEntry, actualEntry, entryPath)
      );
      if (mismatches.includes(null)) {
        continue;
      }
      return (
        mismatches[index] ??
        mismatches[0] ??
        `Key "${entryPath}" is missing in the data layer`
      );
    }
    return null;
  }

  private createValidationError(
    message: string,
    dataLayerSpec: StrictDataLayerEvent,
    dataLayer: BaseDataLayerEvent | StrictDataLayerEvent
  ): ValidationResult {
    return new ValidationResultDto({
      passed: false,
      message,
      dataLayerSpec,
      dataLayer: Array.isArray(dataLayer) ? dataLayer : [dataLayer]
    });
  }

  private createPassedResult(
    dataLayerSpec: StrictDataLayerEvent,
    dataLayerObj: BaseDataLayerEvent | StrictDataLayerEvent
  ): ValidationResult {
    return new ValidationResultDto({
      passed: true,
      message: 'Valid',
      dataLayerSpec,
      dataLayer: Array.isArray(dataLayerObj) ? dataLayerObj : [dataLayerObj]
    });
  }
}

function isPlainObject(value: unknown): value is Indexable {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
