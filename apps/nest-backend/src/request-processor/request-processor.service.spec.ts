import { Test, TestingModule } from '@nestjs/testing';
import { RequestProcessorService } from './request-processor.service';

// can use these requests for testing
const ikeaOldGa4request =
  'https://analytics.google.com/g/collect?v=2&tid=G-816Q2QZJXD&gtm=45je39d0&_p=785921106&cid=1766266903.1693786622&ul=zh-tw&sr=1536x864&ir=1&uaa=x86&uab=64&uafvl=Chromium%3B116.0.5845.179%7CNot)A%253BBrand%3B24.0.0.0%7CGoogle%2520Chrome%3B116.0.5845.179&uamb=0&uam=&uap=Windows&uapv=15.0.0&uaw=0&_eu=EA&_s=2&uid=&cu=TWD&sid=1694993913&sct=3&seg=1&dl=https%3A%2F%2Fwww.ikea.com.tw%2Fzh%2Fproducts%2Fluminaires%2Fclamp-and-wall-lamps%2Fobegransad-art-10526262&dr=https%3A%2F%2Fwww.ikea.com.tw%2Fzh&dt=OBEGR%C3%84NSAD%20-%20LED%E5%A3%81%E7%87%88%2C%20%E9%BB%91%E8%89%B2%20%7C%20IKEA%20%E7%B7%9A%E4%B8%8A%E8%B3%BC%E7%89%A9&en=view_item&_c=1&pr1=brOBEGR%C3%84NSAD~id10526262~nmOBEGR%C3%84NSAD%20LED%20wll%20lmp%20black%20TW~ca1016%20clamp-and-wall-lamps~c2101%20luminaires~c310%20lighting-and-home-electronics~c4na~c5na~k0currency~v0TWD~ds0~pr3299~qt1~cpna~lp1~vaART&ep.userid=&epn.value=3299&_et=4';

const ecommerceDrunkElephantRequest =
  'https://www.google-analytics.com/g/collect?v=2&tid=G-NQJE8CQ5LR&gtm=45je39i0h2&_p=1291686749&_dbg=1&ul=Chinese&cid=1931321060.1685071405&sr=1536x864&uaa=x86&uab=64&uafvl=Chromium%3B116.0.5845.188%7CNot)A%253BBrand%3B24.0.0.0%7CGoogle%2520Chrome%3B116.0.5845.188&uamb=0&uam=&uap=Windows&uapv=15.0.0&uaw=0&_s=1&cu=TWD&sid=1695081032&sct=5&seg=1&dl=https%3A%2F%2Fdevelopment.drunkelephant.com.tw%2F%25E7%25B2%25BE%25E8%258F%25AF%25E6%25B6%25B2-%25E6%25B0%25B4%25E9%25A3%25BD%25E9%25A3%25BD%25E7%25B6%25AD%25E4%25BB%2596%25E5%2591%25BDb5%25E4%25BF%259D%25E6%25BF%2595%25E7%25B2%25BE%25E8%258F%25AF-%257C-b-hydra%25E2%2584%25A2-intensive-hydration-serum-856556004180.html&dr=https%3A%2F%2Fdevelopment.drunkelephant.com.tw%2F%25E7%25B2%25BE%25E8%258F%25AF%25E6%25B6%25B2-%25E7%25B6%25AD%25E4%25BB%2596%25E5%2591%25BDc%25E6%25B4%25BB%25E8%2586%259A%25E6%2597%25A5%25E9%2596%2593%25E7%25B2%25BE%25E8%258F%25AF-%257C-c-firma%25E2%2584%25A2-fresh-day-serum-812343034358.html&dt=%E6%B0%B4%E9%A3%BD%E9%A3%BD%E7%B6%AD%E4%BB%96%E5%91%BDB5%E4%BF%9D%E6%BF%95%E7%B2%BE%E8%8F%AF%20%7C%20%E4%BF%9D%E6%BF%95%E9%80%8F%E4%BA%AE%E4%BF%AE%E8%AD%B7%E4%B8%89%E6%95%88%E5%88%B0%E4%BD%8D&en=view_item&pr1=nm%E6%B0%B4%E9%A3%BD%E9%A3%BD%E7%B6%AD%E4%BB%96%E5%91%BDB5%E4%BF%9D%E6%BF%95%E7%B2%BE%E8%8F%AF%20%7C%20B-Hydra%E2%84%A2%20Intensive%20Hydration%20Serum~id856556004180~pr1650~brDrunkelephant~ca%E6%89%80%E6%9C%89%E7%94%A2%E5%93%81%2F%E8%87%89%E9%83%A8%E4%BF%9D%E9%A4%8A%2F%E7%B2%BE%E8%8F%AF%E6%B6%B2~c2Product~c3IN_STOCK~c5%E7%B2%BE%E8%8F%AF%E6%B6%B2%3E%E6%B0%B4%E9%A3%BD%E9%A3%BD%E7%B6%AD%E4%BB%96%E5%91%BDB5%E4%BF%9D%E6%BF%95%E7%B2%BE%E8%8F%AF%20%7C%20B-Hydra%E2%84%A2%20Intensive%20Hydration%20Serum~li0~ln%2F~k0item_auto_replen~v0NO~va856556004180&ep.websiteCountry=TW&ep.pageCategory=Product%20Page&ep.pageSubCategory=Content&ep.siteLocation=Product%20Page%3EContent&epn.value=1650';

describe('RequestProcessorService', () => {
  let service: RequestProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestProcessorService],
    }).compile();

    service = module.get<RequestProcessorService>(RequestProcessorService);
  });

  // Testing decodeUrl method
  describe('decodeUrl', () => {
    it('should decode URL', () => {
      const url = encodeURIComponent('https://example.com?en=event');
      expect(service.decodeUrl(url)).toBe('https://example.com?en=event');
    });

    it('should decode URL with special characters', () => {
      const url = encodeURIComponent('https://example.com?en=spécial évènt');
      expect(service.decodeUrl(url)).toBe(
        'https://example.com?en=spécial évènt'
      );
    });
  });

  // Testing parseUrl method
  describe('should parse URL', () => {
    it('should parse URL', () => {
      const url = 'https://example.com?en=event';
      const parsed = service.parseUrl(url);
      expect(parsed).toBeInstanceOf(URLSearchParams);
    });

    it('should parse URL with multiple parameters', () => {
      const url = 'https://example.com?en=event&key=value';
      const parsed = service.parseUrl(url);
      expect(parsed.get('key')).toBe('value');
    });
  });

  // Testing extractEvent method
  describe('should extract event name from URLSearchParams', () => {
    it('should extract event name from URLSearchParams', () => {
      const params = new URLSearchParams('en=event');
      expect(service.extractEvent(params)).toBe('event');
    });

    it('should return empty string if event name is not found', () => {
      const params = new URLSearchParams('key=value');
      expect(service.extractEvent(params)).toBe('');
    });
  });

  describe('addCustomEventParameters', () => {
    it('should add custom event parameters to the data layer', () => {
      const dataLayer = {};
      const queryString = 'en=customEvent&ep.customKey=customValue';
      const event = 'customEvent';

      service.addCustomEventParameters(dataLayer, queryString, event);

      expect(dataLayer).toEqual({ customKey: 'customValue' });
    });

    it('should not modify data layer if event is not in queryString', () => {
      const dataLayer = {};
      const queryString = 'en=differentEvent&customKey=customValue';
      const event = 'customEvent';

      service.addCustomEventParameters(dataLayer, queryString, event);

      expect(dataLayer).toEqual({});
    });
  });

  describe('processCustomField', () => {
    it('should process custom key-value fields', () => {
      const item = {};
      const customKeys = {};
      const field = 'k0customKey';

      service.processCustomField(field, item, customKeys);

      expect(customKeys).toEqual({ '0': 'customKey' });
    });

    it('should associate custom value with custom key', () => {
      const item = {};
      const customKeys = { '0': 'customKey' };
      const field = 'v0customValue';

      service.processCustomField(field, item, customKeys);

      expect(item).toEqual({ customKey: 'customValue' });
    });
  });
});
