import { Test, TestingModule } from '@nestjs/testing';
import { GtmOperatorController } from './gtm-operator.controller';
import { mockGtmOperatorService } from './gtm-operator.service.spec';
import { GtmOperatorService } from './gtm-operator.service';

describe('GtmOperatorController', () => {
  let controller: GtmOperatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GtmOperatorController],
      providers: [
        {
          provide: GtmOperatorService,
          useValue: mockGtmOperatorService,
        },
      ],
    }).compile();

    controller = module.get<GtmOperatorController>(GtmOperatorController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('observeGcs', () => {
    it('should call GtmOperatorService.observeGcs', async () => {
      // arrange
      const gtmUrl = 'https://tagmanager.google.com';
      // act
      await controller.observeGcsViaGtm(gtmUrl);
      // assert
      expect(mockGtmOperatorService.observeGcsViaGtm).toHaveBeenCalled();
      expect(mockGtmOperatorService.observeGcsViaGtm).toHaveBeenCalledTimes(1);
    });

    it('should observe gcs multiple times', async () => {
      // arrange
      const gtmUrl = 'https://tagmanager.google.com';
      const expectValue = 'G111';
      const loops = 3;
      const chunks = 1;
      const settings = '--incognito';
      const headless = 'false';
      // act
      await controller.observeAndKeepGcsAnomaliesViaGtm(
        gtmUrl,
        expectValue,
        loops,
        chunks,
        settings,
        headless,
      );
      // assert
      expect(
        mockGtmOperatorService.observeAndKeepGcsAnomaliesViaGtm,
      ).toHaveBeenCalled();
    });
  });
});
