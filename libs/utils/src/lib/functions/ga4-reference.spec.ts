import { describe, expect, it } from 'vitest';
import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  getGa4EventNameIssues
} from './ga4-reference';

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
