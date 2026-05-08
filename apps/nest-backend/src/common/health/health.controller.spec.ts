import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an ok status payload', () => {
    const controller = new HealthController();
    expect(controller.check()).toEqual({
      status: 'ok',
      message: 'Backend is up and running'
    });
  });
});
