import { Test, TestingModule } from '@nestjs/testing';
import { DataLayerCheckerService } from './data-layer-checker.service';
import { AirtableService } from '../airtable/airtable.service';
import { mockAirtableService } from '../airtable/airtable.service.spec';
import { PuppeteerService } from '../web-agent/puppeteer/puppeteer.service';
import { mockPuppeteerService } from '../web-agent/puppeteer/puppeteer.service.spec';

export const mockDataLayerCheckerService = {
  examineResults: jest
    .fn()
    .mockImplementation(() => mockDataLayerCheckerService.updateRecords()),
  updateRecords: jest.fn(),
  checkCodeSpecsAndUpdateRecords: jest.fn(),
  checkCodeSpecOperationAndUpdateRecords: jest.fn(),
  validateDataLayerWithSpecs: jest.fn().mockReturnValue(false),
  validateSchema: jest.fn().mockReturnValue(false),
};

describe('DataLayerCheckerService', () => {
  jest.clearAllMocks();

  let service: DataLayerCheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataLayerCheckerService,
        {
          provide: PuppeteerService,
          useValue: mockPuppeteerService,
        },
        {
          provide: AirtableService,
          useValue: mockAirtableService,
        },
      ],
    }).compile();

    service = module.get<DataLayerCheckerService>(DataLayerCheckerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateDataLayerWithSpecs', () => {
    const testCases = [
      {
        specData: { key: 'value' },
        data: [{ key: 'value' }],
        expected: true,
        desc: 'matches simple object',
      },
      {
        specData: { key: 'value' },
        data: [{ key: 'differentValue' }],
        expected: false,
        desc: 'non-matching simple object',
      },
      // ... Add more cases as needed
    ];

    it.each(testCases)(
      'should return $expected when $desc',
      ({ specData, data, expected }) => {
        expect(service.validateDataLayerWithSpecs(specData, data)).toBe(
          expected,
        );
      },
    );

    it('should return true if a matching object is found', () => {
      const specData = { key: 'value' };
      const data = [{ key: 'value' }, { anotherKey: 'anotherValue' }];

      expect(service.validateDataLayerWithSpecs(specData, data)).toBe(true);
    });
  });

  describe('validateSchema', () => {
    const testCases = [
      {
        specObj: { key: 'value' },
        dataObj: { key: 'value' },
        expected: true,
        desc: 'matches simple object',
      },
      {
        specObj: { key: 'value' },
        dataObj: { key: 'differentValue' },
        expected: false,
        desc: 'non-matching simple object',
      },
      {
        specObj: { key1: 'value1', key2: { subKey: 'subValue' } },
        dataObj: { key1: 'value1', key2: { subKey: 'subValue' } },
        expected: true,
        desc: 'matches nested object',
      },
      {
        specObj: { key1: 'value1', key2: { subKey: 'subValue' } },
        dataObj: { key1: 'value1', key2: { subKey: 'wrongSubValue' } },
        expected: false,
        desc: 'non-matching nested object',
      },
      // ... Add more cases as needed
    ];
    test.each(testCases)(
      'should return $expected when $desc',
      ({ specObj, dataObj, expected }) => {
        expect(service.validateSchema(specObj, dataObj)).toBe(expected);
      },
    );
  });
});
