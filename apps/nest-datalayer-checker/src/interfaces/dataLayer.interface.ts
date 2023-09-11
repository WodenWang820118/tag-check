// Base types for known properties
export interface BaseItem {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: string;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
}

export interface BaseECommerce {
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
}

export interface BaseDataLayerEvent {
  event?: string;
  ecommerce?: BaseECommerce;
  [key: string]: string | number | BaseECommerce | undefined | null;
}

export interface StrictDataLayerEvent {
  event: string;
  ecommerce?: BaseECommerce;
  [key: string]: string | number | BaseECommerce | undefined | null;
}
