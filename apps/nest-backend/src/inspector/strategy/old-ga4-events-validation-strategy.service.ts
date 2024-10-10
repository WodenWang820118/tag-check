/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { StrictDataLayerEvent, BaseDataLayerEvent } from '@utils';
import { ValidationResultDto } from '../../dto/validation-result.dto';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

@Injectable()
export class OldGA4EventsValidationStrategy {
  constructor(
    private dataLayerValidationUtilsService: DataLayerValidationUtilsService
  ) {}
  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    dataLayerSpec: StrictDataLayerEvent
  ) {
    for (const eventObj of dataLayer) {
      if (eventObj.event === dataLayerSpec.event) {
        return this.dataLayerValidationUtilsService.validateKeyValues(
          dataLayerSpec,
          eventObj
        );
      }
    }

    return new ValidationResultDto(
      false,
      `Event not found: ${dataLayerSpec.event}`,
      dataLayerSpec
    );
  }
}
