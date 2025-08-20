import { Module } from '@nestjs/common';
import { EcommerceEventValidationStrategy } from './ecommerce-event-validation-strategy.service';
import { NonEcEventsValidationStrategy } from './non-ec-events-validation-strategy.service';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

const services = [
  EcommerceEventValidationStrategy,
  NonEcEventsValidationStrategy,
  DataLayerValidationUtilsService
];
@Module({
  imports: [],
  providers: [...services],
  exports: [...services]
})
export class DataLayerValidationStrategyModule {}
