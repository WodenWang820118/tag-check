import { describe, expect, it } from 'vitest';
import { toEditableValue } from './application-form.component';

describe('toEditableValue', () => {
  it('shows stored strings without adding quotes', () => {
    expect(toEditableValue('true')).toBe('true');
    expect(toEditableValue('{"ad_storage":true}')).toBe('{"ad_storage":true}');
  });

  it('shows values saved as objects by older versions as JSON', () => {
    expect(toEditableValue({ ad_storage: true })).toBe('{"ad_storage":true}');
  });
});
