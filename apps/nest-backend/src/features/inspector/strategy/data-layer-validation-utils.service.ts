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
    dataLayerObj: BaseDataLayerEvent | StrictDataLayerEvent
  ): ValidationResult {
    for (const key in dataLayerSpec) {
      if (!(key in dataLayerObj)) {
        return this.createValidationError(
          `Key "${key}" is missing in the data layer`,
          dataLayerSpec,
          dataLayerObj
        );
      }

      const eventValue = dataLayerObj[key];
      const specValue = dataLayerSpec[key];

      if (typeof specValue === 'string') {
        if (specValue.startsWith('$')) {
          // Condition 1: Plain string starts with "$". Only checks the key.
          return new ValidationResultDto({
            passed: true,
            message: 'Valid',
            dataLayerSpec,
            dataLayer: Array.isArray(dataLayerObj)
              ? dataLayerObj
              : [dataLayerObj]
          });
        } else if (specValue.startsWith('/') && specValue.endsWith('/')) {
          // Condition 2: Regex literal within the string. Check whether the regex matches.
          if (typeof eventValue !== 'string') {
            return this.createValidationError(
              `Value for key "${key}" is not a string as expected`,
              dataLayerSpec,
              dataLayerObj
            );
          }

          const regex = new RegExp(specValue.slice(1, -1));
          if (!regex.test(eventValue)) {
            return this.createValidationError(
              `Value for key "${key}" does not match the regex pattern`,
              dataLayerSpec,
              dataLayerObj
            );
          }
        } else {
          // Condition 3: Plain string with static value. Checks whether the value equals.
          if (specValue !== eventValue) {
            return this.createValidationError(
              `Value for key "${key}" does not match the expected value`,
              dataLayerSpec,
              dataLayerObj
            );
          }
        }
      } else if (typeof specValue === 'number') {
        // If the spec value is a number, compare it directly
        if (specValue !== eventValue) {
          return this.createValidationError(
            `Value for key "${key}" does not match the expected value`,
            dataLayerSpec,
            dataLayerObj
          );
        }
      }
    }

    return new ValidationResultDto({
      passed: true,
      message: 'Valid',
      dataLayerSpec,
      dataLayer: Array.isArray(dataLayerObj) ? dataLayerObj : [dataLayerObj]
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
      dataLayer: Array.isArray(dataLayer) ? dataLayer : [dataLayer]
    });
  }
}
