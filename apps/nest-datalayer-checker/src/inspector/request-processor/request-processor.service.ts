import { Injectable } from '@nestjs/common';
import { BaseItem } from '../../shared/interfaces/data-layer.interface';
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

  extractEvent(queryParams: URLSearchParams): string {
    return queryParams.get('en') || '';
  }

  addCustomEventParameters(
    dataLayer: any,
    queryString: string,
    event: string
  ): void {
    const enIndex = queryString.indexOf('en=' + event);
    if (enIndex === -1) return;

    // TODO: will need all parameters for other issues
    // payload request when parameters are too long
    const remainingParams = queryString.slice(
      enIndex + ('en=' + event).length + 1
    );
    const remainingQueryParams = new URLSearchParams(remainingParams);

    for (const [key, val] of remainingQueryParams.entries()) {
      if (!['en', '_c', '_et'].includes(key) && !/^pr\d+$/.test(key)) {
        // the key.split('.')[1] is to remove the 'ep.' or 'epn'. etc prefix from the key
        dataLayer[key.split('.')[1]] = val;
      }
    }
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
    const event = this.extractEvent(queryParams);
    const dataLayer: any = { event };

    const queryString = queryParams.toString();
    this.addCustomEventParameters(dataLayer, queryString, event);
    const items = this.extractItems(queryParams, queryString);

    if (items.length) {
      dataLayer.items = items;
    }
    return dataLayer;
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
