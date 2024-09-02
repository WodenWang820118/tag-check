import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  ValidationResult,
} from '@utils';
import { ValidationResultDto } from '../dto/validation-result.dto';

export enum ValidationStrategyType {
  ECOMMERCE = 'ecommerce',
  OLDGA4EVENTS = 'oldGA4Events',
}

export function determineStrategy(spec: StrictDataLayerEvent) {
  try {
    if (isNumericKeysObject([ValidationStrategyType.ECOMMERCE])) {
      return ValidationStrategyType.ECOMMERCE;
    } else {
      return ValidationStrategyType.OLDGA4EVENTS;
    }
  } catch (error) {
    const errorMessage = `There is no spec available for determining strategy.`;
    Logger.error(errorMessage, 'Utilities.determineStrategy');
    throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export function validateKeyValues(
  dataLayerSpec: StrictDataLayerEvent,
  dataLayer: BaseDataLayerEvent | StrictDataLayerEvent
): ValidationResult {
  for (const key in dataLayerSpec) {
    if (!(key in dataLayer)) {
      return new ValidationResultDto(
        false,
        `Key "${key}" is not present in the dataLayer`,
        dataLayerSpec,
        dataLayer
      );
    }

    const eventValue = dataLayer[key];
    const specValue = dataLayerSpec[key];

    if (typeof specValue === 'string') {
      if (specValue.startsWith('$')) {
        // Condition 1: Plain string starts with "$". Only checks the key.
        continue; // Move to the next key
      } else if (specValue.startsWith('/') && specValue.endsWith('/')) {
        // Condition 2: Regex literal within the string. Check whether the regex matches.
        if (typeof eventValue !== 'string') {
          return new ValidationResultDto(
            false,
            `Value for key "${key}" is not a string as expected`,
            dataLayerSpec,
            dataLayer
          );
        }

        const regex = new RegExp(specValue.slice(1, -1));
        if (!regex.test(eventValue)) {
          return new ValidationResultDto(
            false,
            `Value for key "${key}" does not match the regex pattern`,
            dataLayerSpec,
            dataLayer
          );
        }
      } else {
        // Condition 3: Plain string with static value. Checks whether the value equals.
        if (specValue !== eventValue) {
          return new ValidationResultDto(
            false,
            `Value for key "${key}" does not match the expected value`,
            dataLayerSpec,
            dataLayer
          );
        }
      }
    } else if (typeof specValue === 'number') {
      // If the spec value is a number, compare it directly
      if (specValue !== eventValue) {
        return new ValidationResultDto(
          false,
          `Value for key "${key}" does not match the expected value`,
          dataLayerSpec,
          dataLayer
        );
      }
    }
  }

  return new ValidationResultDto(true, 'Valid', dataLayerSpec, dataLayer);
}

function isNumericKeysObject(obj: unknown): obj is Record<number, unknown> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Object.keys(obj).every(Number.isInteger)
  );
}
