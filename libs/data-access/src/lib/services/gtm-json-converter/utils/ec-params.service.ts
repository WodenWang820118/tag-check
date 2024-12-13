import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EcParamsService {
  getEcParams() {
    return [
      'value',
      'currency',
      'transaction_id',
      'coupon',
      'shipping',
      'tax',
      'shipping_tier',
      'payment_type',
      'items',
      'promotion_id',
      'promotion_name',
      'creative_name',
      'creative_slot',
      'location_id',
      'campaign_id',
      'campaign_name',
      'source',
      'medium',
      'content',
      'term',
      'affiliation',
      'item_list_id',
      'item_list_name',
      'search_term',
      'success',
      'content_type',
      'content_id',
      'content_group',
      'engagement_time_msec',
      'form_id',
      'form_name',
      'form_destination',
      'language',
      'page_location',
      'page_referrer',
      'page_title',
      'screen_resolution'
    ];
  }
}
