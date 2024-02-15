import { Controller } from '@nestjs/common';
import { WaiterSpecService } from './waiter-spec.service';

@Controller('waiter-spec')
export class WaiterSpecController {
  constructor(private waiterSpecService: WaiterSpecService) {}
}
