import { Test } from '@nestjs/testing';
import { ActionService } from './action.service';
import { RequestInterceptor } from './request-interceptor';
import { StepExecutor } from './step-executor';
import { ClickHandler } from './handlers/click-handler.service';
import { ChangeHandler } from './handlers/change-handler.service';
import { HoverHandler } from './handlers/hover-handler.service';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { BrowserAction } from './action-utils';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { describe, it, expect, vi } from 'vitest';

// const mockWorkSheet = {
//   addRows: jest.fn().mockImplementation(),
//   addImage: jest.fn().mockImplementation(),
// };

// const mockWorkbook = {
//   addWorksheet: jest.fn().mockReturnValue(mockWorkSheet),
//   addImage: jest.fn().mockReturnValue('mockImageId'),
//   xlsx: {
//     writeFile: jest.fn().mockResolvedValue(undefined),
//   },
// };

// jest.mock('exceljs', () => ({
//   Workbook: jest.fn().mockImplementation(() => mockWorkbook),
// }));

// jest.mock('fs', () => ({
//   readFileSync: jest.fn().mockReturnValue(JSON.stringify({ valid: 'json' })),
//   writeFileSync: jest.fn(),
// }));

// jest.mock('path', () => ({
//   join: jest.fn().mockReturnValue('mockPath'),
// }));

// const mockOperation = {
//   steps: [
//     {
//       type: 'click',
//       target: 'main',
//       selectors: ['.button'],
//     },
//     {
//       type: 'click',
//       target: 'main',
//       selectors: ['.button'],
//     },
//   ],
//   title: 'Mock Operation Title',
// };

const moduleMocker = new ModuleMocker(global);
// TODO: Perform unit tests
describe('ActionService', () => {
  let service: ActionService;
  let requestInterceptor: RequestInterceptor;
  let dataLayerService: DataLayerService;
  let stepExecutor: StepExecutor;
  let clickHandler: ClickHandler;
  let changeHandler: ChangeHandler;
  let hoverHandler: HoverHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ActionService],
    })
      .useMocker((token) => {
        if (token === RequestInterceptor) {
          return {
            intercept: vi.fn(),
          };
        }

        if (token === DataLayerService) {
          return {
            push: vi.fn(),
          };
        }

        if (token === ClickHandler) {
          return {
            handle: vi.fn(),
          };
        }

        if (token === ChangeHandler) {
          return {
            handle: vi.fn(),
          };
        }

        if (token === HoverHandler) {
          return {
            handle: vi.fn(),
          };
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = moduleRef.get<ActionService>(ActionService);
    requestInterceptor = moduleRef.get<RequestInterceptor>(RequestInterceptor);
    dataLayerService = moduleRef.get<DataLayerService>(DataLayerService);
    clickHandler = moduleRef.get<ClickHandler>(ClickHandler);
    changeHandler = moduleRef.get<ChangeHandler>(ChangeHandler);
    hoverHandler = moduleRef.get<HoverHandler>(HoverHandler);
    stepExecutor = new StepExecutor(
      {
        [BrowserAction.CLICK]: clickHandler,
        [BrowserAction.CHANGE]: changeHandler,
        [BrowserAction.HOVER]: hoverHandler,
      },
      dataLayerService
    );
  });

  it('should performOperation', async () => {});
});
