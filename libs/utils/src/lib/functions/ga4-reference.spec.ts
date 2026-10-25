import { describe, expect, it } from 'vitest';
import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  getGa4EventNameIssues,
  getGa4ParameterNameIssues
} from './ga4-reference';

describe('getGa4ParameterNameIssues', () => {
  it.each(['user_id', 'percent_scrolled', 'item_category2'])(
    'accepts %s',
    (parameterName) => {
      expect(getGa4ParameterNameIssues(parameterName)).toEqual([]);
    }
  );

  it.each(['user.id', 'gtag.config', '_private', 'page-type'])(
    'rejects %j',
    (parameterName) => {
      expect(getGa4ParameterNameIssues(parameterName)).toContain(
        'must start with a letter and use only letters, numbers and underscores'
      );
    }
  );

  it.each(['firebase_', 'ga_', 'google_'])(
    'rejects names that begin with %s',
    (prefix) => {
      expect(getGa4ParameterNameIssues(`${prefix}source`)).toEqual([
        `must not begin with the reserved prefix "${prefix}"`
      ]);
    }
  );
});

describe('getGa4EventNameIssues', () => {
  it.each(['page_view', 'add_to_cart', 'Purchase2', '購買_完成'])(
    'accepts %s',
    (eventName) => {
      expect(getGa4EventNameIssues(eventName)).toEqual([]);
    }
  );

  it.each(['GA4 event - view_promotion', '_private', '1st_visit', 'a-b', ''])(
    'rejects %j',
    (eventName) => {
      expect(getGa4EventNameIssues(eventName)).toContain(
        'must start with a letter and use only letters, numbers and underscores'
      );
    }
  );

  it('rejects names longer than 40 characters', () => {
    expect(getGa4EventNameIssues('a'.repeat(40))).toEqual([]);
    expect(getGa4EventNameIssues('a'.repeat(41))).toEqual([
      'must be at most 40 characters'
    ]);
  });
});

describe('GA4_ECOMMERCE_EVENT_PARAMETERS', () => {
  it('lists items for every recommended ecommerce event', () => {
    for (const parameters of Object.values(GA4_ECOMMERCE_EVENT_PARAMETERS)) {
      expect(parameters).toContain('items');
    }
  });
});
