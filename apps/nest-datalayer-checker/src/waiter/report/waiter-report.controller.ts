import { Controller } from '@nestjs/common';
import { WaiterReportService } from './waiter-report.service';

@Controller('waiter-report')
export class WaiterReportController {
  constructor(private waiterReportService: WaiterReportService) {}
}
