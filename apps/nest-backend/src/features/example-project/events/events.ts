import { addPaymentInfoExample } from './add-payment-info';
import { addShippingInfoExample } from './add-shipping-info';
import { addToCartExample } from './add-to-cart';
import { beginCheckoutExample } from './begin-checkout';
import { pageViewExample } from './page-view';
import { purchaseExample } from './purchase';
import { refundExample } from './refund';
import { selectPromotionExample } from './select-promotion';
import { viewCartExample } from './view-cart';
import { viewItemExample } from './view-item';
import { viewItemListExample } from './view-item-list';
import { viewPromotionExample } from './view-promotion';
import type { ItemDef, Recording, Spec } from '@utils';

export type ExampleEvent = {
  eventName: string;
  testName: string;
  recording: Recording;
  spec: Spec;
  fullItemDef?: ItemDef;
};

export const events: Record<string, ExampleEvent> = {
  pageView: pageViewExample,
  viewItemList: viewItemListExample,
  viewItem: viewItemExample,
  selectPromotion: selectPromotionExample,
  viewPromotion: viewPromotionExample,
  addToCart: addToCartExample,
  viewCart: viewCartExample,
  beginCheckout: beginCheckoutExample,
  addShippingInfo: addShippingInfoExample,
  addPaymentInfo: addPaymentInfoExample,
  refund: refundExample,
  purchase: purchaseExample
};
