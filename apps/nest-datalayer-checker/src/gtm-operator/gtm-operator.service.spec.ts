import { Test, TestingModule } from '@nestjs/testing';
import { GtmOperatorService } from './gtm-operator.service';
import { mockPuppeteerService } from '../web-agent/puppeteer/puppeteer.service.spec';

export const mockGtmOperatorService = {
  puppeteerService: mockPuppeteerService,
  goToPageViaGtm: jest.fn().mockImplementation(async () => {
    const browser = await mockPuppeteerService.initAndReturnBrowser();
    const page = await mockPuppeteerService.gotoAndReturnPage(
      'https://tagmanager.google.com',
      browser,
    );

    // mock the $eval, $ and waitForTarget method of the Puppeteer
    page.$eval = jest.fn((selector, inputElement) => {});

    page.$ = jest.fn(selector => {
      return Promise.resolve({
        click: jest.fn(),
      });
    });

    browser.waitForTarget = jest.fn().mockImplementation(target => {
      return Promise.resolve({
        url: () => 'https://www.example.com',
      });
    });

    browser.pages = jest.fn().mockReturnValue([page]);

    // implement the test
    await page.$eval('#domain-start-url', el => {
      el.value = '';
    });
    await page.$eval('#domain-start-url', el => {
      el.value = 'https://www.example.com';
    });

    await page.$('#include-debug-param').then(el => el?.click());
    await page.$('#domain-start-button').then(el => el?.click());

    await browser.waitForTarget(
      target => target.url() === 'https://www.example.com',
    );

    return { browser, page };
  }),

  crawlPageResponses: jest.fn().mockImplementation(async () => {
    const page = mockPuppeteerService.gotoAndReturnPage();
    page.setRequestInterception = jest.fn().mockImplementation(boolean => {});
    page.on = jest.fn().mockImplementation((event, callback) => {
      callback();
    });
    page.reload = jest.fn().mockImplementation(options => {});
    page.close = jest.fn().mockImplementation(() => {});
    page.setRequestInterception(true);
    page.on('request', async request => {});
    page.reload({ waitUntil: 'networkidle2' });
    page.close();
  }),
  observeGcsViaGtm: jest
    .fn()
    .mockImplementation(
      async (gtmUrl: string, args: string, headless: string) => {
        const { browser, page } = await mockGtmOperatorService.goToPageViaGtm(
          gtmUrl,
          args,
          headless,
        );
        const pages = await browser.pages();
        const respones = await mockGtmOperatorService.crawlPageResponses(
          pages[pages.length - 1],
        );
        const gcs = await mockPuppeteerService.getGcs(respones);
        return { browser, gcs };
      },
    ),
  observeAndKeepGcsAnomaliesViaGtm: jest.fn(),
};

describe('GtmOperatorService', () => {
  let service: GtmOperatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GtmOperatorService,
          useValue: mockGtmOperatorService,
        },
      ],
    }).compile();

    service = module.get<GtmOperatorService>(GtmOperatorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have PuppeteerService', () => {
    expect(service.puppeteerService).toBeDefined();
  });

  describe('should open the GTM interface and go to the designated testing page', () => {
    // arrange
    const gtmUrl = 'https://tagmanager.google.com';
    const args = '--no-sandbox, --disable-setuid-sandbox';
    const headless = 'false';

    it('should wait according the browser', async () => {
      // act
      const { browser, page } = await service.goToPageViaGtm(
        gtmUrl,
        args,
        headless,
      );
      const pages = await browser.pages();
      // assert
      expect(browser.waitForTarget).toHaveBeenCalled();
    });
  });

  describe('crawlPageResponses', () => {
    const gtmUrl = 'https://tagmanager.google.com';
    const args = '--no-sandbox, --disable-setuid-sandbox';
    const headless = 'false';
    it('should go to the url and return a page instance', async () => {
      // act
      const { browser, page } = await service.goToPageViaGtm(
        gtmUrl,
        args,
        headless,
      );
      const pages = await browser.pages();
      service.crawlPageResponses(pages[pages.length - 1]);
      // assert
      expect(page).toBeDefined();
    });

    it('should set the request interception to true', async () => {
      // act
      const { browser, page } = await service.goToPageViaGtm(
        gtmUrl,
        args,
        headless,
      );
      const spy = jest.spyOn(browser, 'pages');
      const pages = await browser.pages();
      service.crawlPageResponses(pages[pages.length - 1]);
      // assert
      expect(page.setRequestInterception).toHaveBeenCalledWith(true);

      spy.mockRestore();
      spy.mockReset();
    });

    it('should listen to the request event', async () => {
      // act
      const { browser, page } = await service.goToPageViaGtm(
        gtmUrl,
        args,
        headless,
      );
      const spy = jest.spyOn(browser, 'pages');
      const pages = await browser.pages();
      service.crawlPageResponses(pages[pages.length - 1]);
      // assert
      expect(page.on).toHaveBeenCalled();

      spy.mockRestore();
      spy.mockReset();
    });

    it('should reload the page', async () => {
      // act
      const { browser, page } = await service.goToPageViaGtm(
        gtmUrl,
        args,
        headless,
      );
      const spy = jest.spyOn(browser, 'pages');
      const pages = await browser.pages();
      service.crawlPageResponses(pages[pages.length - 1]);
      // assert
      expect(page.reload).toHaveBeenCalled();

      spy.mockRestore();
      spy.mockReset();
    });

    it('should close the page', async () => {
      // act
      // act
      const { browser, page } = await service.goToPageViaGtm(
        gtmUrl,
        args,
        headless,
      );
      const spy = jest.spyOn(browser, 'pages');
      const pages = await browser.pages();
      service.crawlPageResponses(pages[pages.length - 1]);
      // assert
      expect(page.close).toHaveBeenCalled();

      spy.mockRestore();
      spy.mockReset();
    });

    it('should have reponses returned', async () => {
      // act
      const { browser, page } = await service.goToPageViaGtm(
        gtmUrl,
        args,
        headless,
      );
      const spy = jest.spyOn(browser, 'pages');
      const pages = await browser.pages();
      const responses = service.crawlPageResponses(pages[pages.length - 1]);
      // assert
      expect(responses).toBeDefined();

      spy.mockRestore();
      spy.mockReset();
    });
  });

  it('should observe the GCS', async () => {
    // act
    const gtmUrl = 'https://tagmanager.google.com';
    await service.observeGcsViaGtm(gtmUrl);
    // assert
    expect(service.crawlPageResponses).toHaveBeenCalled();
    expect(service.crawlPageResponses).toBeDefined();
  });

  describe('observeAndKeepGcsAnomaliesViaGtm', () => {
    it('should detect GCS anomaly and return anomaly report', async () => {
      const gtmUrl = 'http://example.com';
      const expectValue = 'G111';
      const loops = 10;
      const chunks = 2;
      const args = '--no-sandbox';
      const headless = 'true';
      service.observeAndKeepGcsAnomaliesViaGtm = jest.fn().mockResolvedValue([
        {
          anomalyCount: 1,
          gcs: 'G100',
          date: '2020-01-01',
        },
      ]);

      const report = await service.observeAndKeepGcsAnomaliesViaGtm(
        gtmUrl,
        expectValue,
        loops,
        chunks,
        args,
        headless,
      );

      expect(report).not.toBeNull();
      expect(report).toHaveLength(1);
      expect(report[0]).toHaveProperty('anomalyCount', 1);
      expect(report[0]).toHaveProperty('gcs');
      expect(report[0]).toHaveProperty('date');
    });

    it('should not detect GCS anomaly and return empty report', async () => {
      const gtmUrl = 'http://example.com';
      const expectValue = 'bar';
      const loops = 10;
      const chunks = 2;
      const args = '--no-sandbox';
      const headless = 'true';
      service.observeAndKeepGcsAnomaliesViaGtm = jest
        .fn()
        .mockResolvedValue([]);
      const report = await service.observeAndKeepGcsAnomaliesViaGtm(
        gtmUrl,
        expectValue,
        loops,
        chunks,
        args,
        headless,
      );

      expect(report).not.toBeNull();
      expect(report).toHaveLength(0);
    });
  });
});
