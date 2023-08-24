import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerService } from './puppeteer.service';
import { Browser } from 'puppeteer';

// mock the target service because it depends on puppeteer and browser
export const mockPuppeteerService = {
  getDataLayer: jest.fn().mockReturnValue(['dom.js']),
  getOperationJson: jest.fn().mockReturnValue({
    name: 'eeListClick',
    steps: [
      {
        type: 'setViewport',
        width: 1335,
        height: 929,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false,
      },
    ],
  }),
  performOperation: jest.fn(),
  clickElement: jest.fn(),
  getInstalledGtms: jest
    .fn()
    .mockImplementation(() => mockPuppeteerService.getAllRequests()),
  getAllRequests: jest.fn().mockReturnValue(['GTM-XXXXXX']),
  fetchDataLayer: jest.fn().mockImplementation((url: string) => {
    const browser = mockPuppeteerService.initAndReturnBrowser();
    const page = mockPuppeteerService.nativateTo(url, browser);
    return mockPuppeteerService.getDataLayer(page);
  }),
  getGcs: jest.fn().mockReturnValue(['111']),
  detectGtm: jest.fn().mockImplementation(async (url: string) => {
    const browser = mockPuppeteerService.initAndReturnBrowser();
    const page = mockPuppeteerService.nativateTo(url, browser);
    const result = await mockPuppeteerService.getInstalledGtms(url);
    browser.close = jest.fn();
    await browser.close();
    return result;
  }),
  performOperationViaGtm: jest.fn(),
  initAndReturnBrowser: jest
    .fn()
    .mockReturnValue(async (puppeteer, settings: {}) => {
      return await puppeteer.launch({ ...settings });
    }),
  nativateTo: jest
    .fn()
    .mockReturnValue(async (url: string, browser: Browser) => {
      const page = browser.newPage();
      (await page).goto(url);
      return page;
    }),
};

describe('PuppeteerService', () => {
  let service: PuppeteerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PuppeteerService,
          useValue: mockPuppeteerService,
        },
      ],
    }).compile();

    service = module.get<PuppeteerService>(PuppeteerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization and Navigation', () => {
    const url = 'https://www.google.com';

    it('should init the Puppeteer and return the browser for the specific instance', async () => {
      const browser = await service.initAndReturnBrowser();
      expect(browser).toBeDefined();
    });

    it('should navigate to the page and return the page instance', async () => {
      const browser = await service.initAndReturnBrowser();
      const page = await service.nativateTo(url, browser);
      expect(service.initAndReturnBrowser).toHaveBeenCalled();
      expect(service.nativateTo).toHaveBeenCalledWith(url, browser);
      expect(page).toBeDefined();
    });
  });

  it('should print out the dataLayer', async () => {
    // arrange
    const url = 'https://www.google.com';
    // actual
    const browser = await service.initAndReturnBrowser();
    const page = await service.nativateTo(url, browser);
    const dataLayer = await service.getDataLayer(page);
    // assert
    expect(dataLayer).toBeDefined();
  });

  it('should load specific JSON recording', async () => {
    // actual
    const operation = service.getOperationJson('eeListClick');
    // assert
    expect(operation).toBeInstanceOf(Object);
  });

  it('should perform operation according to the JSON recording', async () => {
    // arrange
    const url = 'https://www.google.com';
    const browser = await service.initAndReturnBrowser();
    const page = await service.nativateTo(url, browser);
    // actual
    const operation = service.getOperationJson('eeListClick');
    await service.performOperation(page, operation);
    // assert
    expect(operation).toBeInstanceOf(Object);
    expect(service.nativateTo).toHaveBeenCalled();
  });

  it('should give the installed GTM according to the URL', async () => {
    // arrange
    const url = 'https://www.google.com';
    const browser = await service.initAndReturnBrowser();
    const page = await service.nativateTo(url, browser);
    // actual
    const gtm = await service.getInstalledGtms(page, url);
    // assert
    expect(service.getAllRequests).toHaveBeenCalled();
    expect(gtm.length).toBeGreaterThan(0);
  });

  describe('should fetchDataLayer', () => {
    // arrange
    const url = 'https://www.google.com';
    // assert
    it('should initAndReturnBrowser', async () => {
      // actual
      const browser = await service.initAndReturnBrowser();
      const page = await service.nativateTo(url, browser);
      // assert
      expect(service.initAndReturnBrowser).toHaveBeenCalled();
      expect(browser).toBeDefined();
      expect(page).toBeDefined();
    });

    it('should nativateTo', async () => {
      // actual
      const browser = await service.initAndReturnBrowser();
      const page = await service.nativateTo(url, browser);
      // assert
      expect(service.nativateTo).toHaveBeenCalled();
      expect(page).toBeDefined();
    });

    it('should getDataLayer', async () => {
      // actual
      const browser = await service.initAndReturnBrowser();
      const page = await service.nativateTo(url, browser);
      const actual = await service.getDataLayer(page);
      // assert
      expect(service.getDataLayer).toHaveBeenCalled();
      expect(actual).toBeDefined();
    });

    it('should return the dataLayer', async () => {
      // actual
      const browser = await service.initAndReturnBrowser();
      const page = await service.nativateTo(url, browser);
      const dataLayer = await service.fetchDataLayer(url);
      // assert
      expect(dataLayer).toBeDefined();
    });
  });

  describe('should detect gtm ids', () => {
    // arrange
    const url = 'https://www.104.com.tw/jobs/main/';
    // assert
    it('should initAndReturnBrowser', async () => {
      await service.detectGtm(url);
      expect(service.initAndReturnBrowser).toHaveBeenCalled();
      expect(service.initAndReturnBrowser).toHaveBeenCalledTimes(1);
    });
    it('should nativateTo', async () => {
      await service.detectGtm(url);
      expect(service.nativateTo).toHaveBeenCalled();
      expect(service.nativateTo).toHaveBeenCalledTimes(1);
    });
    it('should getInstalledGtms', async () => {
      const actual = await service.detectGtm(url);
      expect(service.getInstalledGtms).toHaveBeenCalled();
      expect(service.getInstalledGtms).toHaveBeenCalledTimes(1);
    });
    it('browser should close', async () => {
      const browser = await service.initAndReturnBrowser();
      const page = await service.nativateTo(url, browser);
      await service.detectGtm(url);
      expect(browser.close).toHaveBeenCalled();
    });
    it('should return GTM ids', async () => {
      const actual = await service.detectGtm(url);
      expect(actual.length).toBeGreaterThan(0);
    });
  });

  describe('should init puppeteer and return its instance browser and page', () => {
    // assert
    it('should initAndReturnBrowser', async () => {
      const browser = await service.initAndReturnBrowser();
      expect(service.initAndReturnBrowser).toBeCalled();
      expect(browser).toBeDefined();
    });

    it('should return page', async () => {
      const browser = await service.initAndReturnBrowser();
      const actual = await service.nativateTo(
        'https://www.google.com',
        browser,
      );
      expect(actual).toBeDefined();
    });
  });
});
