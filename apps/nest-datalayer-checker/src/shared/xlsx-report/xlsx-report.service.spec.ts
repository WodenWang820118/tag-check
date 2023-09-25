import { Test, TestingModule } from '@nestjs/testing';
import { XlsxReportService } from './xlsx-report.service';

describe('XlsxReportService', () => {
  let service: XlsxReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XlsxReportService],
    }).compile();

    service = module.get<XlsxReportService>(XlsxReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
