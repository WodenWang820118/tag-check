import { Controller } from '@nestjs/common';
import { WaiterReportService } from './waiter-report.service';

@Controller('reports')
export class WaiterReportController {
  constructor(private waiterReportService: WaiterReportService) {}
}
