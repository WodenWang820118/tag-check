import { Controller } from '@nestjs/common';
import { WaiterSpecService } from './waiter-spec.service';

@Controller('specs')
export class WaiterSpecController {
  constructor(private waiterSpecService: WaiterSpecService) {}
}
