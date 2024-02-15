import { Controller } from '@nestjs/common';
import { WaiterConfigurationService } from './waiter-configuration.service';

@Controller('waiter-configuration')
export class WaiterConfigurationController {
  constructor(private waiterConfigurationService: WaiterConfigurationService) {}
}
