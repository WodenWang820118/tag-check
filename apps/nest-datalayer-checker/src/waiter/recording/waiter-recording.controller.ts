import { Controller } from '@nestjs/common';
import { WaiterRecordingService } from './waiter-recording.service';

@Controller('recordings')
export class WaiterRecordingController {
  constructor(private waiterProjectService: WaiterRecordingService) {}
}
