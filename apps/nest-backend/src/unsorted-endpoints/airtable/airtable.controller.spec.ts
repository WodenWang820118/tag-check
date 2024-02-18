import { Test, TestingModule } from '@nestjs/testing';
import { AirtableController } from './airtable.controller';
import { AirtableService } from './airtable.service';
import { mockAirtableService, token } from './airtable.service.spec';
import { Observable } from 'rxjs';

const baseId = 'app123';
const tableId = 'table123';
const viewId = 'view123';

describe('AirtableController', () => {
  let controller: AirtableController;
  let service: AirtableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirtableController],
      providers: [
        {
          provide: AirtableService,
          useValue: mockAirtableService,
        },
      ],
    }).compile();

    controller = module.get<AirtableController>(AirtableController);
    service = module.get<AirtableService>(AirtableService);
  });

  it('controller should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should GET the endpoint and return records', () => {
    // arrange
    // act
    const records = controller.getRecords(baseId, tableId, token);
    // assert
    expect(records).toBeDefined();
    expect(records).toBeInstanceOf(Observable);
  });

  it('should GET the endpoint and return cell values in the specific view', () => {
    // arrange
    // act
    const records = controller.getView(baseId, tableId, viewId, token);
    // assert
    expect(records).toBeDefined();
    expect(records).toBeInstanceOf(Observable);
  });
});
