 
import { Injectable, Logger } from '@nestjs/common';
import { StrictDataLayerEvent, BaseDataLayerEvent } from '@utils';
import { ValidationResultDto } from '../../../shared/dto/validation-result.dto';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

@Injectable()
export class NonEcEventsValidationStrategy {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly dataLayerValidationUtilsService: DataLayerValidationUtilsService
  ) {}
  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    dataLayerSpec: StrictDataLayerEvent
  ) {
    this.logger.debug(`Data layer: ${JSON.stringify(dataLayer, null, 2)}`);
    for (const eventObj of dataLayer) {
      this.logger.debug(
        `Validating event: ${JSON.stringify(eventObj, null, 2)}`
      );
      if (eventObj.event?.toString() === dataLayerSpec.event) {
        return this.dataLayerValidationUtilsService.validateKeyValues(
          dataLayerSpec,
          eventObj
        );
      }
    }

    return new ValidationResultDto({
      passed: false,
      message: `Event not found: ${dataLayerSpec.event}`,
      dataLayerSpec
    });
  }
}
