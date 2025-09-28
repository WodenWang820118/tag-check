import { Injectable } from '@nestjs/common';
import {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
  ValidationResult,
  BaseECommerce
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
      const result = this.validateSpecValue(
        key,
        specValue,
        eventValue,
        dataLayerSpec,
        dataLayerObj
      );
      if (result) {
        return result;
      }
    }
    return this.createPassedResult(dataLayerSpec, dataLayerObj);
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

  private validateSpecValue(
    key: string,
    specValue: string | number | BaseECommerce | null | undefined,
    eventValue: unknown,
    dataLayerSpec: StrictDataLayerEvent,
    dataLayerObj: BaseDataLayerEvent | StrictDataLayerEvent
  ): ValidationResult | null {
    if (typeof specValue === 'string') {
      return this.validateStringSpec(
        key,
        specValue,
        eventValue,
        dataLayerSpec,
        dataLayerObj
      );
    }
    if (typeof specValue === 'number') {
      if (specValue === eventValue) {
        return null;
      }
      return this.createValidationError(
        `Value for key "${key}" does not match the expected value`,
        dataLayerSpec,
        dataLayerObj
      );
    }
    return null;
  }

  private validateStringSpec(
    key: string,
    specValue: string,
    eventValue: unknown,
    dataLayerSpec: StrictDataLayerEvent,
    dataLayerObj: BaseDataLayerEvent | StrictDataLayerEvent
  ): ValidationResult | null {
    if (specValue.startsWith('$')) {
      return this.createPassedResult(dataLayerSpec, dataLayerObj);
    }
    if (specValue.startsWith('/') && specValue.endsWith('/')) {
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
      return null;
    }
    if (specValue === eventValue) {
      return null;
    }
    return this.createValidationError(
      `Value for key "${key}" does not match the expected value`,
      dataLayerSpec,
      dataLayerObj
    );
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
