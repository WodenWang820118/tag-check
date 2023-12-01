import { Test, TestingModule } from '@nestjs/testing';
import { Credentials, Page } from 'puppeteer';
// real services
import { WebAgentService } from './web-agent.service';
import { WebMonitoringService } from './web-monitoring/web-monitoring.service';
import { DataLayerService } from './web-monitoring/data-layer/data-layer.service';
import { SharedService } from '../shared/shared.service';
import { ActionService } from './action/action.service';
import { dataLayerObj } from '../mock/mock-data';
import { RequestService } from './web-monitoring/request/request.service';
import { ProjectService } from '../shared/project/project.service';
import { FileService } from '../shared/file/file.service';
import { XlsxReportService } from '../shared/xlsx-report/xlsx-report.service';
import { ClickHandler } from './action/handlers/click-handler.service';
import { ChangeHandler } from './action/handlers/change-handler.service';
import { HoverHandler } from './action/handlers/hover-handler.service';
import { RequestInterceptor } from './action/request-interceptor';
import { mockPage } from '../mock/mock-service.spec';

describe('WebAgentService', () => {
  let service: WebAgentService;
  let webMonitoringService: WebMonitoringService;
  let dataLayerService: DataLayerService;
  let sharedService: SharedService;
  let actionService: ActionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebAgentService,
        WebMonitoringService,
        DataLayerService,
        SharedService,
        RequestService,
        ActionService,
        {
          provide: Page,
          useValue: mockPage,
        },
        {
          provide: ProjectService,
          useValue: {},
        },
        {
          provide: FileService,
          useValue: {},
        },
        {
          provide: XlsxReportService,
          useValue: {},
        },
        {
          provide: ClickHandler,
          useValue: {},
        },
        {
          provide: ChangeHandler,
          useValue: {},
        },
        {
          provide: HoverHandler,
          useValue: {},
        },
        {
          provide: RequestInterceptor,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WebAgentService>(WebAgentService);
    webMonitoringService =
      module.get<WebMonitoringService>(WebMonitoringService);
    dataLayerService = module.get<DataLayerService>(DataLayerService);
    sharedService = module.get<SharedService>(SharedService);
    actionService = module.get<ActionService>(ActionService);
  });

  it('should executeAndGetDataLayer', async () => {
    const performTestSpy = jest
      .spyOn(service, 'performTest')
      .mockImplementation(
        async (
          page: Page,
          projectName: string,
          testName: string,
          filePath?: string,
          captureRequest = false,
          measurementId?: string,
          credentials?: Credentials
        ) => {
          return Promise.resolve({
            dataLayer: dataLayerObj,
            eventRequest: 'eventRequest',
            destinationUrl: 'http://www.google.com',
          });
        }
      );

    const result = await service.executeAndGetDataLayer(
      mockPage as unknown as Page,
      'projectName',
      'testName'
    );

    expect(performTestSpy).toHaveBeenCalled();
    expect(result).toEqual({
      dataLayer: result.dataLayer,
      destinationUrl: result.destinationUrl,
    });
  });

  it('should executeAndGetDataLayerAndRequest', async () => {
    const performTestSpy = jest
      .spyOn(service, 'performTest')
      .mockImplementation(
        async (
          page: Page,
          projectName: string,
          testName: string,
          filePath?: string,
          captureRequest = false,
          measurementId?: string,
          credentials?: Credentials
        ) => {
          return Promise.resolve({
            dataLayer: dataLayerObj,
            eventRequest: 'eventRequest',
            destinationUrl: 'http://www.google.com',
          });
        }
      );

    const result = await service.executeAndGetDataLayerAndRequest(
      mockPage as unknown as Page,
      'projectName',
      'testName'
    );

    expect(performTestSpy).toHaveBeenCalled();
    expect(result).toEqual({
      dataLayer: result.dataLayer,
      eventRequest: result.eventRequest,
      destinationUrl: result.destinationUrl,
    });
  });

  it('should performTest', async () => {
    const initEventFolderSpy = jest
      .spyOn(webMonitoringService, 'initEventFolder')
      .mockImplementation(() => {
        return {};
      });

    const initSelfDataLayerSpy = jest
      .spyOn(dataLayerService, 'initSelfDataLayer')
      .mockImplementation(() => {
        return {};
      });

    const getOperationJsonSpy = jest
      .spyOn(sharedService, 'getOperationJson')
      .mockImplementation(() => {
        return {};
      });

    const performOperationSpy = jest
      .spyOn(actionService, 'performOperation')
      .mockImplementation(
        async (page: Page, projectName: string, operation: any) => {
          Promise.resolve();
        }
      );

    const updateSelfDataLayerSpy = jest
      .spyOn(dataLayerService, 'updateSelfDataLayer')
      .mockImplementation(
        async (page: Page, projectName: string, operation: any) => {
          Promise.resolve();
        }
      );

    const getMyDataLayerSpy = jest
      .spyOn(dataLayerService, 'getMyDataLayer')
      .mockImplementation(() => {
        return {};
      });

    const result = await service.performTest(
      mockPage as unknown as Page,
      'projectName',
      'testName'
    );

    expect(initEventFolderSpy).toHaveBeenCalled();
    expect(initSelfDataLayerSpy).toHaveBeenCalled();
    expect(getOperationJsonSpy).toHaveBeenCalled();
    expect(performOperationSpy).toHaveBeenCalled();
    expect(mockPage.waitForNavigation).toHaveBeenCalled();
    expect(updateSelfDataLayerSpy).toHaveBeenCalled();
    expect(getMyDataLayerSpy).toHaveBeenCalled();

    expect(result).toEqual({
      dataLayer: result.dataLayer,
      eventRequest: result.eventRequest,
      destinationUrl: result.destinationUrl,
    });
  });
});
