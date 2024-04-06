import { Injectable, Logger } from '@nestjs/common';
import { BaseItem } from '@utils';
import { parse, URLSearchParams } from 'url';
import { standardParameterMap } from './utilities';

@Injectable()
export class RequestProcessorService {
  decodeUrl(url: string): string {
    return decodeURIComponent(url);
  }

  parseUrl(decodedUrl: string): URLSearchParams {
    const parsedUrl = parse(decodedUrl);
    return new URLSearchParams(parsedUrl.query || '');
  }

  extractEventName(queryParams: URLSearchParams): string {
    return queryParams.get('en') || '';
  }

  addCustomEventParameters(dataLayer: any, queryString: string) {
    const queryParams = new URLSearchParams(queryString);
    for (const [key, val] of queryParams.entries()) {
      // Process custom parameters
      if (key.startsWith('ep.')) {
        const customKey = key.split('.')[1];
        dataLayer[customKey] = val;
      } else if (key.startsWith('epn.')) {
        const customKey = key.split('.')[1];
        dataLayer[customKey] = val;
      } else if (key.startsWith('cu')) {
        dataLayer['currency'] = val;
      } else {
        // ignore other parameters
        continue;
      }
    }
    return dataLayer;
  }

  processCustomField(
    field: string,
    item: BaseItem,
    customKeys: { [index: string]: string }
  ): void {
    const customKeyMatch = field.match(/^k(\d+)/);
    const customValueMatch = field.match(/^v(\d+)/);

    if (customKeyMatch) {
      const index = customKeyMatch[1];
      customKeys[index] = field.substring(`k${index}`.length);
    } else if (customValueMatch) {
      const index = customValueMatch[1];
      if (customKeys[index]) {
        item[customKeys[index]] = field.substring(`v${index}`.length);
      }
    } else {
      const [otherCustomKey, otherCustomValue] = field.split('=');
      item[otherCustomKey] = otherCustomValue;
    }
  }

  extractItems(queryParams: URLSearchParams, queryString: string): BaseItem[] {
    const items: BaseItem[] = [];
    const regex = /(pr\d+)=/g;
    let match;

    while ((match = regex.exec(queryString)) !== null) {
      const matchedKeyName = match[1];
      const itemParam = queryParams.get(matchedKeyName);
      if (itemParam) {
        const item = this.formStandardItemObj(itemParam);
        items.push(item);
      }
    }

    return items;
  }

  recomposeGA4ECEvent(url: string) {
    const decodedUrl = this.decodeUrl(url);
    const queryParams = this.parseUrl(decodedUrl);
    const event = this.extractEventName(queryParams);
    const dataLayer: any = { event };

    const queryString = queryParams.toString();
    const updatedDataLayer = this.addCustomEventParameters(
      dataLayer,
      queryString
    );
    const items = this.extractItems(queryParams, queryString);

    if (items.length) {
      updatedDataLayer.ecommerce = {
        value: updatedDataLayer.value || '', // Ensure value is set, default to empty string if not present
        currency: updatedDataLayer.currency || '', // Ensure currency is set, default to empty string if not present
        items: items,
      };

      delete updatedDataLayer.value;
      delete updatedDataLayer.currency;
    }

    Logger.log(updatedDataLayer, 'recomposeGA4ECEvent: dataLayer');
    return updatedDataLayer;
  }

  formStandardItemObj(product: string): BaseItem {
    const productFields = product.split('~');
    const item: BaseItem = {};
    const customKeys: { [index: string]: string } = {};

    productFields.forEach((field) => {
      const paramName = Object.keys(standardParameterMap).find((key) =>
        field.startsWith(key)
      );

      if (!paramName) {
        this.processCustomField(field, item, customKeys);
        return;
      }

      item[standardParameterMap[paramName]] = field.split(paramName)[1];
    });

    return item;
  }
}
