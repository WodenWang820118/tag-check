import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ConfigurationControllerService } from './configuration-controller.service';

function build() {
  const configurationService = {
    findAll: vi.fn(),
    findOneByName: vi.fn(),
    create: vi.fn()
  };
  return {
    service: new ConfigurationControllerService(configurationService as never),
    configurationService
  };
}

describe('ConfigurationControllerService', () => {
  it('getConfigurations() returns the full list from the repository', async () => {
    const ctx = build();
    ctx.configurationService.findAll.mockResolvedValue([{ name: 'a' }]);
    expect(await ctx.service.getConfigurations()).toEqual([{ name: 'a' }]);
  });

  it('getConfiguration() throws NotFound when the configuration is missing', async () => {
    const ctx = build();
    ctx.configurationService.findOneByName.mockResolvedValue(undefined);
    await expect(
      ctx.service.getConfiguration('missing')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getConfiguration() returns the configuration value', async () => {
    const ctx = build();
    ctx.configurationService.findOneByName.mockResolvedValue({ value: 'v' });
    expect(await ctx.service.getConfiguration('a')).toEqual({ value: 'v' });
  });

  it('createConfiguration() forwards to repository.create', () => {
    const ctx = build();
    ctx.service.createConfiguration('n', 'v');
    expect(ctx.configurationService.create).toHaveBeenCalledWith({
      name: 'n',
      value: 'v'
    });
  });
});
