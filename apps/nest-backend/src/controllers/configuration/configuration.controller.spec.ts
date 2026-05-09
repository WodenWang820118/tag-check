import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ConfigurationController } from './configuration.controller';

describe('ConfigurationController', () => {
  function build(serviceOverrides: Record<string, unknown> = {}) {
    const service = {
      getConfigurations: vi.fn().mockResolvedValue([{ name: 'a' }]),
      getConfiguration: vi.fn().mockResolvedValue({ name: 'a', value: '1' }),
      createConfiguration: vi.fn().mockResolvedValue('created'),
      ...serviceOverrides
    };
    const controller = new ConfigurationController(service as never);
    return { controller, service };
  }

  it('getError surfaces the Sentry test error', async () => {
    const { controller } = build();
    let caught: unknown;
    try {
      const result = controller.getError() as unknown;
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result;
      }
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe('My first Sentry error!');
  });

  it('getConfigurations delegates to the service', async () => {
    const { controller, service } = build();
    const result = await controller.getConfigurations();
    expect(service.getConfigurations).toHaveBeenCalledOnce();
    expect(result).toEqual([{ name: 'a' }]);
  });

  it('getConfiguration delegates to the service when it succeeds', async () => {
    const { controller, service } = build();
    const result = await controller.getConfiguration('a');
    expect(service.getConfiguration).toHaveBeenCalledWith('a');
    expect(result).toEqual({ name: 'a', value: '1' });
  });

  it('getConfiguration rethrows NotFoundException as-is', async () => {
    const notFound = new NotFoundException('missing');
    const { controller } = build({
      getConfiguration: vi.fn().mockRejectedValue(notFound)
    });
    await expect(controller.getConfiguration('missing')).rejects.toBe(notFound);
  });

  it('getConfiguration wraps unexpected errors in InternalServerErrorException', async () => {
    const { controller } = build({
      getConfiguration: vi.fn().mockRejectedValue(new Error('db down'))
    });
    await expect(controller.getConfiguration('x')).rejects.toMatchObject({
      message: 'An error occurred while fetching the configuration'
    });
  });

  it('createConfiguration forwards name and value to the service', () => {
    const { controller, service } = build();
    controller.createConfiguration({ name: 'k', value: 'v' });
    expect(service.createConfiguration).toHaveBeenCalledWith('k', 'v');
  });
});
