import { Injectable } from '@nestjs/common';
import {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
  ValidationResult
} from '@utils';
import { ValidationResultDto } from '../../../shared/dto/validation-result.dto';

@Injectable()
export class DataLayerValidationUtilsService {
  validateKeyValues(
    dataLayerSpec: StrictDataLayerEvent,
    dataLayer: BaseDataLayerEvent | StrictDataLayerEvent
  ): ValidationResult {
    for (const key in dataLayerSpec) {
      if (!(key in dataLayer)) {
        return this.createValidationError(
          `Key "${key}" is missing in the data layer`,
          dataLayerSpec,
          dataLayer
        );
      }

      const eventValue = dataLayer[key];
      const specValue = dataLayerSpec[key];

      if (typeof specValue === 'string') {
        if (specValue.startsWith('$')) {
          // Condition 1: Plain string starts with "$". Only checks the key.
          return new ValidationResultDto({
            passed: true,
            message: 'Valid',
            dataLayerSpec,
            dataLayer
          });
        } else if (specValue.startsWith('/') && specValue.endsWith('/')) {
          // Condition 2: Regex literal within the string. Check whether the regex matches.
          if (typeof eventValue !== 'string') {
            return this.createValidationError(
              `Value for key "${key}" is not a string as expected`,
              dataLayerSpec,
              dataLayer
            );
          }

          const regex = new RegExp(specValue.slice(1, -1));
          if (!regex.test(eventValue)) {
            return this.createValidationError(
              `Value for key "${key}" does not match the regex pattern`,
              dataLayerSpec,
              dataLayer
            );
          }
        } else {
          // Condition 3: Plain string with static value. Checks whether the value equals.
          if (specValue !== eventValue) {
            return this.createValidationError(
              `Value for key "${key}" does not match the expected value`,
              dataLayerSpec,
              dataLayer
            );
          }
        }
      } else if (typeof specValue === 'number') {
        // If the spec value is a number, compare it directly
        if (specValue !== eventValue) {
          return this.createValidationError(
            `Value for key "${key}" does not match the expected value`,
            dataLayerSpec,
            dataLayer
          );
        }
      }
    }

    return new ValidationResultDto({
      passed: true,
      message: 'Valid',
      dataLayerSpec,
      dataLayer
    });
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
      dataLayer
    });
  }
}
