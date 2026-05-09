import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationSettingRepositoryService } from './application-setting-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    save: vi.fn()
  };
  const service = new ApplicationSettingRepositoryService(repository as never);
  return { service, repository };
}

describe('ApplicationSettingRepositoryService', () => {
  it('get() returns a DTO matching the persisted entity', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({
      id: 1,
      localStorage: { data: [] },
      cookie: { data: [] },
      gtm: {}
    });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toMatchObject({ id: 1 });
  });

  it('create() persists a new entity bound to the provided project', async () => {
    const { service, repository } = build();
    const projectEntity = { id: 9, projectSlug: 'demo' } as never;
    const data = {
      localStorage: { data: [{ key: 'k', value: 'v' }] },
      cookie: { data: [] },
      gtm: { containerId: 'GTM-X' }
    };
    repository.save.mockImplementation(async (entity) => ({
      id: 42,
      ...entity
    }));
    const result = await service.create(projectEntity, data as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.project).toBe(projectEntity);
    expect(saved.localStorage).toEqual(data.localStorage);
    expect(saved.cookie).toEqual(data.cookie);
    expect(saved.gtm).toEqual(data.gtm);
    expect(result).toBeDefined();
  });

  it('update() merges updates into the existing setting and returns the saved DTO', async () => {
    const { service, repository } = build();
    const project = { id: 5, projectSlug: 'demo' } as never;
    repository.findOne.mockResolvedValue({ id: 7, localStorage: { data: [] } });
    repository.save.mockImplementation(async (entity) => entity);
    const data = {
      localStorage: { data: [{ key: 'k', value: 'v' }] }
    } as never;
    const result = await service.update(project, data);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { project: { id: 5 } }
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        project,
        localStorage: data.localStorage
      })
    );
    expect(result).toBeDefined();
  });

  it('update() throws NOT_FOUND when no existing setting is found', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.update({ id: 1, projectSlug: 'demo' } as never, {} as never)
    ).rejects.toMatchObject({ status: HttpStatus.INTERNAL_SERVER_ERROR });
  });

  it('update() rethrows save failures as INTERNAL_SERVER_ERROR', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    repository.save.mockRejectedValue(new Error('db down'));
    await expect(
      service.update({ id: 1, projectSlug: 'demo' } as never, {} as never)
    ).rejects.toBeInstanceOf(HttpException);
  });
});
