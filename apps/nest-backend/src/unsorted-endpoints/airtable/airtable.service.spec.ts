import { Test, TestingModule } from '@nestjs/testing';
import { AirtableService } from './airtable.service';
import { Observable } from 'rxjs';

export const mockAirtableService = {
  getRecords: jest.fn().mockReturnValue(new Observable()),
  getView: jest.fn().mockReturnValue(new Observable()),
  updateCodeSpecRecords: jest.fn().mockReturnValue(new Observable()),
  createField: jest.fn().mockReturnValue(new Observable()),
};

export const baseId = 'app123';
export const tableId = 'table123';
export const viewId = 'view123';
export const token = 'token123';
export const fields = { name: 'test' };

describe('AirtableService', () => {
  let service: AirtableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AirtableService,
          useValue: mockAirtableService,
        },
      ],
    }).compile();

    service = module.get<AirtableService>(AirtableService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get records observable', () => {
    // arrange
    // actual
    const records = service.getRecords(baseId, tableId, token);
    // assert
    expect(records).toBeDefined();
  });

  it('should get view data observable', () => {
    // arrange
    // actual
    const records = service.getView(baseId, tableId, viewId, token);
    // assert
    expect(records).toBeDefined();
  });

  it('should patch (update) the code spec match records and return observable', () => {
    // arrange
    const fieldName = 'Code Spec Match';
    // actual
    const response = service.updateCodeSpecRecords(
      baseId,
      tableId,
      [],
      fieldName,
      token,
    );
    // assert
    expect(mockAirtableService.updateCodeSpecRecords).toHaveBeenCalledWith(
      baseId,
      tableId,
      [],
      fieldName,
      token,
    );
    expect(response).toBeInstanceOf(Observable);
  });
});
