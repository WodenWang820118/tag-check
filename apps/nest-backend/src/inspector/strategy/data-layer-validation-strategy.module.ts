import { Module } from '@nestjs/common';
import { EcommerceEventValidationStrategy } from './ecommerce-event-validation-strategy.service';
import { OldGA4EventsValidationStrategy } from './old-ga4-events-validation-strategy.service';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

const services = [
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
  DataLayerValidationUtilsService,
];
@Module({
  imports: [],
  providers: [...services],
  exports: [...services],
})
export class DataLayerValidationStrategyModule {}
