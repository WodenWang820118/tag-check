import { ImageSchema } from './file-report.type';

// Common category types
type Category = {
  readonly item_category?: string;
  readonly item_category2?: string;
  readonly item_category3?: string;
  readonly item_category4?: string;
  readonly item_category5?: string;
};

// Base types for known properties
export type BaseItem = {
  item_id?: string;
  item_name?: string;
  affiliation?: string;
  coupon?: string;
  discount?: string;
  index?: number;
  item_brand?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
} & Category;

export type BaseECommerce = {
  transaction_id?: string;
  currency?: string;
  shipping?: number;
  coupon?: string;
  tax?: number;
  value?: number;
  items?: BaseItem[];
  item_list_id?: string;
  item_list_name?: string;
  creative_name?: string;
  creative_slot?: string;
  promotion_id?: string;
  promotion_name?: string;
};

export type BaseDataLayerEvent = {
  event?: string;
  ecommerce?: BaseECommerce;
  [key: string]: string | number | BaseECommerce | undefined | null;
};

export type StrictDataLayerEvent = {
  event: string;
  ecommerce?: BaseECommerce;
  [key: string]: string | number | BaseECommerce | undefined | null;
};

export type ValidationResult = {
  passed: boolean;
  message?: string;
  eventName: string;
  dataLayer: StrictDataLayerEvent | BaseDataLayerEvent;
  dataLayerSpec: StrictDataLayerEvent | BaseDataLayerEvent;
};

export type RequestValidationResult = {
  requestPassed: boolean;
  rawRequest: string;
  reformedDataLayer: StrictDataLayerEvent | BaseDataLayerEvent;
  dataLayerSpec: StrictDataLayerEvent | BaseDataLayerEvent;
};

export type OutputValidationResult = {
  eventId: string;
  testName: string;
  destinationUrl: string;
  createdAt?: Date;
} & ValidationResult &
  RequestValidationResult &
  ImageSchema;

export type ValidationStrategy = {
  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    spec: StrictDataLayerEvent
  ): ValidationResult;
};

// export type TestDataLayer = {
//   dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
//   dataLayerSpec: StrictDataLayerEvent | BaseDataLayerEvent;
// };

// export type TestDataLayerSchema = {
//   id: number;
// } & TestDataLayer &
//   Auditable;
