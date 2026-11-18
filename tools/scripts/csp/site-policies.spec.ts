import { describe, expect, it } from 'vitest';

import { SITE_POLICIES } from './site-policies.ts';

describe('SITE_POLICIES', () => {
  it('forbids unsafe-inline and unsafe-eval in ng-product-doc script-src', () => {
    const scriptSrc = SITE_POLICIES['ng-product-doc'].directives['script-src'];

    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('enables inline script hashing for ng-product-doc', () => {
    expect(SITE_POLICIES['ng-product-doc'].hashInlineScripts).toBe(true);
  });
});
