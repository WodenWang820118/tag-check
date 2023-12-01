import { Test, TestingModule } from '@nestjs/testing';
import { ActionService } from './action.service';
import { mockPage } from '../../mock/mock-service.spec';
import { RequestInterceptor } from './request-interceptor';
import { StepExecutor } from './step-executor';
import { ClickHandler } from './handlers/click-handler.service';
import { ChangeHandler } from './handlers/change-handler.service';
import { HoverHandler } from './handlers/hover-handler.service';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { BrowserAction } from './action-utils';
import { SharedService } from '../../shared/shared.service';

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
  readFileSync: jest.fn().mockReturnValue(JSON.stringify({ valid: 'json' })),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('mockPath'),
}));

const mockOperation = {
  steps: [
    {
      type: 'click',
      target: 'main',
      selectors: ['.button'],
    },
    {
      type: 'click',
      target: 'main',
      selectors: ['.button'],
    },
  ],
  title: 'Mock Operation Title',
};

describe('ActionService', () => {
  let service: ActionService;
  let requestInterceptor: RequestInterceptor;
  let dataLayerService: DataLayerService;
  let stepExecutor: StepExecutor;
  let clickHandler: ClickHandler;
  let changeHandler: ChangeHandler;
  let hoverHandler: HoverHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionService,
        RequestInterceptor,
        DataLayerService,
        {
          provide: ClickHandler,
          useValue: {
            handle: jest.fn().mockImplementation(async () => {
              return;
            }),
          },
        },
        {
          provide: ChangeHandler,
          useValue: {
            handle: jest.fn().mockImplementation(async () => {
              return;
            }),
          },
        },
        {
          provide: HoverHandler,
          useValue: {
            handle: jest.fn().mockImplementation(async () => {
              return;
            }),
          },
        },
        {
          provide: SharedService,
          useValue: {
            getReportSavingFolder: jest.fn().mockReturnValue('mockedFolder'),
          },
        },
      ],
    }).compile();

    service = module.get<ActionService>(ActionService);
    requestInterceptor = module.get<RequestInterceptor>(RequestInterceptor);
    dataLayerService = module.get<DataLayerService>(DataLayerService);
    clickHandler = module.get<ClickHandler>(ClickHandler);
    changeHandler = module.get<ChangeHandler>(ChangeHandler);
    hoverHandler = module.get<HoverHandler>(HoverHandler);
    stepExecutor = new StepExecutor(
      {
        [BrowserAction.CLICK]: clickHandler,
        [BrowserAction.CHANGE]: changeHandler,
        [BrowserAction.HOVER]: hoverHandler,
      },
      dataLayerService
    );
  });

  it('should performOperation', async () => {
    const setupInterceptionSpy = jest.spyOn(
      requestInterceptor,
      'setupInterception'
    );

    const updateSelfDataLayerSpy = jest.spyOn(
      dataLayerService,
      'updateSelfDataLayer'
    );

    const projectName = 'MockProject';

    await service.performOperation(mockPage as any, projectName, mockOperation);

    expect(setupInterceptionSpy).toHaveBeenCalled();
    expect(updateSelfDataLayerSpy).toHaveBeenCalled();
  }, 15000);
});
