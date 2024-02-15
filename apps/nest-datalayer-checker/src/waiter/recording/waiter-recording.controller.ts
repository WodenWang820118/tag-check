import { Controller } from '@nestjs/common';
import { WaiterRecordingService } from './waiter-recording.service';

@Controller('waiter-recording')
export class WaiterRecordingController {
  constructor(private waiterProjectService: WaiterRecordingService) {}
}
