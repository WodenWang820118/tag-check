import { Test, TestingModule } from '@nestjs/testing';
import { RequestProcessorService } from './request-processor.service';
import { describe, it, expect } from 'vitest';
import { parseGa4CollectRequest } from '../web-agent/action/request-interceptor/ga4-collect-request';
import {
  GTAG_ADD_TO_CART_HIT,
  GTAG_BATCHED_HIT,
  GTAG_DEBUG_MODE_HIT,
  GTAG_LONG_VIEW_ITEM_LIST_HIT,
  GTAG_PURCHASE_HIT,
  GTAG_VIEW_PROMOTION_HIT
} from '../web-agent/action/request-interceptor/gtag-collect-hits.spec-helpers';

const ecommerceRequest =
  'https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK&gtm=45je4410v9171567282z89168785492za200&_p=1712224628461&gcs=G111&gcd=13r3r3r3q7&npa=1&dma=0&cid=485839296.1712224634&ul=en-us&sr=2195x1235&uaa=x86&uab=64&uafvl=Chromium%3B121.0.6167.85%7CNot%2520A(Brand%3B99.0.0.0&uamb=0&uam=&uap=Windows&uapv=15.0.0&uaw=0&pscdl=noapi&_s=5&dr=&dl=&cu=USD&sid=1712224634&sct=1&seg=1&dt=Ng%20GTM%20Integration%20App&en=add_to_cart&pr1=idcity001~nmSwitzerland~lndestinations~caSwitzerland~qt1~pr799&ep.debug_mode=false&epn.value=799&ep.promotion_id=city001&ep.promotion_name=Switzerland&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&_et=8682&tfd=30981';
describe('RequestProcessorService', () => {
  let service: RequestProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestProcessorService]
    }).compile();

    service = module.get<RequestProcessorService>(RequestProcessorService);
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
        page_referrer: '',
        ecommerce: {
          value: 799,
          currency: 'USD',
          items: [
            {
              item_id: 'city001',
              item_name: 'Switzerland',
              item_category: 'Switzerland',
              price: 799,
              quantity: 1,
              item_list_name: 'destinations'
            }
          ]
        }
      };

      const actual = service.recomposeGA4ECEvent(ecommerceRequest);
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('recomposeGA4ECEvent with requests recorded from gtag.js', () => {
    // The item from the add_to_cart example in Google's recommended events reference.
    const officialItem = {
      item_id: 'SKU_12345',
      item_name: 'Stan and Friends Tee',
      affiliation: 'Google Merchandise Store',
      coupon: 'SUMMER_FUN',
      discount: 2.22,
      index: 0,
      item_brand: 'Google',
      item_category: 'Apparel',
      item_category2: 'Adult',
      item_category3: 'Shirts',
      item_category4: 'Crew',
      item_category5: 'Short sleeve',
      item_list_id: 'related_products',
      item_list_name: 'Related Products',
      item_variant: 'green',
      location_id: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
      price: 10.01,
      quantity: 3
    };
    const page = {
      page_location: 'http://127.0.0.1/shop/item?a=1&b=two%20words',
      page_title: 'Shoes & Bags #1'
    };

    it('restores official item parameter names, number types and escaped characters', () => {
      expect(
        service.recomposeGA4ECEvent(GTAG_ADD_TO_CART_HIT.url)
      ).toStrictEqual({
        event: 'add_to_cart',
        ...page,
        ecommerce: {
          currency: 'USD',
          value: 30.03,
          items: [
            { ...officialItem, in_stock: 'yes & #1 = C++ 50% ~tilde 台北' }
          ]
        }
      });
    });

    it('nests the purchase transaction parameters under ecommerce', () => {
      expect(service.recomposeGA4ECEvent(GTAG_PURCHASE_HIT.url)).toStrictEqual({
        event: 'purchase',
        ...page,
        ecommerce: {
          currency: 'USD',
          value: 72.05,
          customer_type: 'new',
          transaction_id: 'T_12345',
          coupon: 'SUMMER_SALE',
          shipping: 5.99,
          tax: 3.6,
          items: [officialItem]
        }
      });
    });

    it('keeps promotion fields at both event and item level', () => {
      expect(
        service.recomposeGA4ECEvent(GTAG_VIEW_PROMOTION_HIT.url)
      ).toStrictEqual({
        event: 'view_promotion',
        ...page,
        ecommerce: {
          creative_name: 'Summer Banner',
          creative_slot: 'featured_app_1',
          promotion_id: 'P_12345',
          promotion_name: 'Summer Sale',
          items: [
            {
              ...officialItem,
              creative_name: 'summer_banner2',
              creative_slot: 'featured_app_1',
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale'
            }
          ]
        }
      });
    });

    it('drops debug_mode and leaves non-ecommerce events flat', () => {
      expect(
        service.recomposeGA4ECEvent(GTAG_DEBUG_MODE_HIT.url)
      ).toStrictEqual({ event: 'sign_up', ...page, method: 'email' });
    });

    it('recomposes one event out of a batched request', () => {
      const search = parseGa4CollectRequest(
        GTAG_BATCHED_HIT.url,
        GTAG_BATCHED_HIT.body
      ).find((event) => event.eventName === 'search');

      expect(service.recomposeGA4ECEvent(search!.normalizedUrl)).toStrictEqual({
        event: 'search',
        ...page,
        search_term: 'a&b #c +d'
      });
    });

    it('recomposes an event that gtag.js moved into the POST body', () => {
      const [viewItemList] = parseGa4CollectRequest(
        GTAG_LONG_VIEW_ITEM_LIST_HIT.url,
        GTAG_LONG_VIEW_ITEM_LIST_HIT.body
      );

      const recomposed = service.recomposeGA4ECEvent(
        viewItemList.normalizedUrl
      );

      expect(recomposed.ecommerce.item_list_id).toBe('list_6');
      expect(recomposed.ecommerce.item_list_name).toBe('List 6');
      expect(recomposed.ecommerce.items).toHaveLength(6);
      expect(recomposed.ecommerce.items[5]).toStrictEqual({
        ...officialItem,
        item_id: 'SKU_5',
        index: 5
      });
    });
  });

  it('restores page_path from the dp key of a GTM page_view hit', () => {
    // Recorded from the ng-gtm-sample "GA4 event - page_view" tag in preview mode.
    const url =
      'https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK&_dbg=1&_s=2&dp=%2Fhome&dt=Home&dl=https%3A%2F%2Fng-gtm-sample.vercel.app%2Fhome&en=page_view&_et=11';

    expect(service.recomposeGA4ECEvent(url)).toEqual({
      event: 'page_view',
      page_path: '/home',
      page_title: 'Home',
      page_location: 'https://ng-gtm-sample.vercel.app/home'
    });
  });
});
