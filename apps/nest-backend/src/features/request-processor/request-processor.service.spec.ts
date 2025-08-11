import { Test, TestingModule } from '@nestjs/testing';
import { RequestProcessorService } from './request-processor.service';
import { describe, it, expect } from 'vitest';

const ecommerceRequest =
  'https://www.google-analytics.com/g/collect?v=2&tid=G-8HK542DQMG&gtm=45je4410v9171567282z89168785492za200&_p=1712224628461&gcs=G111&gcd=13r3r3r3q7&npa=1&dma=0&cid=485839296.1712224634&ul=en-us&sr=2195x1235&uaa=x86&uab=64&uafvl=Chromium%3B121.0.6167.85%7CNot%2520A(Brand%3B99.0.0.0&uamb=0&uam=&uap=Windows&uapv=15.0.0&uaw=0&pscdl=noapi&_s=5&dr=&dl=&cu=USD&sid=1712224634&sct=1&seg=1&dt=Ng%20GTM%20Integration%20App&en=add_to_cart&pr1=idcity001~nmSwitzerland~lndestinations~caSwitzerland~qt1~pr799&ep.debug_mode=false&epn.value=799&ep.promotion_id=city001&ep.promotion_name=Switzerland&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&_et=8682&tfd=30981';
describe('RequestProcessorService', () => {
  let service: RequestProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestProcessorService]
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
      expect(service.extractEventName(params)).toBe('event');
    });

    it('should return empty string if event name is not found', () => {
      const params = new URLSearchParams('key=value');
      expect(service.extractEventName(params)).toBe('');
    });
  });

  describe('addCustomEventParameters', () => {
    it('should add custom event parameters to the data layer', () => {
      const dataLayer = {};
      const queryString = 'en=customEvent&ep.customKey=customValue';

      service.addCustomEventParameters(dataLayer, queryString);

      expect(dataLayer).toEqual({ customKey: 'customValue' });
    });

    it('should not modify data layer if event is not in query string', () => {
      const dataLayer = {};
      const queryString = 'en=differentEvent&customKey=customValue';

      service.addCustomEventParameters(dataLayer, queryString);

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

  describe('recomposeGA4ECEvent', () => {
    it('should recompose GA4 EC Event', () => {
      const expected = {
        event: 'add_to_cart',
        page_location: '',
        page_title: 'Ng GTM Integration App',
        creative_name: 'travel_slide',
        creative_slot: 'featured_attributor',
        promotion_id: 'city001',
        promotion_name: 'Switzerland',
        ecommerce: {
          value: '799',
          currency: 'USD',
          items: [
            {
              item_id: 'city001',
              item_name: 'Switzerland',
              item_category: 'Switzerland',
              price: '799',
              quantity: '1',
              item_list_name: 'destinations'
            }
          ]
        }
      };

      const actual = service.recomposeGA4ECEvent(ecommerceRequest);
      expect(actual).toStrictEqual(expected);
    });
  });
});
