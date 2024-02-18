import { Test, TestingModule } from '@nestjs/testing';
import { XlsxReportService } from './xlsx-report.service';

const mockWorkSheet = {
  addRows: jest.fn().mockImplementation(),
  addImage: jest.fn().mockImplementation(),
};

const mockWorkbook = {
  addWorksheet: jest.fn().mockReturnValue(mockWorkSheet),
  addImage: jest.fn().mockReturnValue('mockImageId'),
  xlsx: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
};

jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => mockWorkbook),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('mockBuffer'),
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('mockPath'),
}));

describe('XlsxReportService', () => {
  let service: XlsxReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XlsxReportService],
    }).compile();

    service = module.get<XlsxReportService>(XlsxReportService);
  });

  it('should writeXlsxFile with single test', async () => {
    await service.writeXlsxFile(
      'savingFolder',
      'results',
      'sheet1',
      [
        {
          dataLayerResult: {},
          requestCheckResult: {},
          rawRequest: {},
          destinationUrl: {},
        },
      ],
      'testName',
      'projectName'
    );

    expect(mockWorkbook.addWorksheet).toBeCalledTimes(1);
    expect(mockWorkbook.addImage).toBeCalledTimes(1);
    expect(mockWorkSheet.addRows).toBeCalledTimes(1);
    expect(mockWorkbook.xlsx.writeFile).toBeCalledTimes(1);
  });
});
