import { Test, TestingModule } from '@nestjs/testing';
import { DataLayerCheckerController } from './data-layer-checker.controller';
import { AirtableModule } from '../airtable/airtable.module';
import { PuppeteerModule } from '../web-agent/puppeteer/puppeteer.module';
import { DataLayerCheckerService } from './data-layer-checker.service';
import { mockDataLayerCheckerService } from './data-layer-checker.service.spec';
import { AirtableService } from '../airtable/airtable.service';
import { mockAirtableService } from '../airtable/airtable.service.spec';
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';

const baseId = 'app123';
const tableId = 'table123';
const token = 'token123';

describe('DataLayerCheckerController', () => {
  let controller: DataLayerCheckerController;
  let airtableService: AirtableService;
  let service: DataLayerCheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AirtableModule, PuppeteerModule, GtmOperatorModule],
      controllers: [DataLayerCheckerController],
      providers: [
        {
          provide: AirtableService,
          useValue: mockAirtableService,
        },
        {
          provide: DataLayerCheckerService,
          useValue: mockDataLayerCheckerService,
        },
      ],
    }).compile();

    controller = module.get<DataLayerCheckerController>(
      DataLayerCheckerController,
    );

    airtableService = module.get<AirtableService>(AirtableService);
    service = module.get<DataLayerCheckerService>(DataLayerCheckerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('should get airtable records; handle data checking operation; update multiple records in batch of 10', () => {
    it('should examinationResults', () => {
      // arrange
      const fieldName = 'Code Spec Match';
      // act
      controller.checkCodeSpecsAndUpdateRecords(
        baseId,
        tableId,
        fieldName,
        token,
      );
      // assert
      expect(service.checkCodeSpecsAndUpdateRecords).toHaveBeenCalled();
      expect(service.checkCodeSpecsAndUpdateRecords).toBeCalledTimes(1);
    });
  });
});
