import { Test, TestingModule } from '@nestjs/testing';
import { ActionService } from './action.service';
import { UtilitiesService } from '../utilities/utilities.service';

describe('ActionService', () => {
  let service: ActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionService,
        {
          provide: UtilitiesService,
          useValue: {
            scrollIntoViewIfNeeded: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ActionService>(ActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
