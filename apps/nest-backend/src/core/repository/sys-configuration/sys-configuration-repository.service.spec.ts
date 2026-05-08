import { describe, expect, it, vi } from 'vitest';
import { SysConfigurationRepositoryService } from './sys-configuration-repository.service';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, existsSync: vi.fn() };
});

import { existsSync } from 'fs';

function build() {
  const repository: Record<string, unknown> = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createQueryBuilder: vi.fn()
  };
  const configsService = {
    getCONFIG_ROOT_PATH: vi.fn().mockReturnValue('rootPath'),
    getROOT_PROJECT_PATH: vi.fn().mockReturnValue('/tmp/projects'),
    getCONFIG_CURRENT_PROJECT_PATH: vi.fn().mockReturnValue('currentPath')
  };
  const service = new SysConfigurationRepositoryService(
    repository as never,
    configsService as never
  );
  return { service, repository, configsService };
}

describe('SysConfigurationRepositoryService', () => {
  describe('checkIfRootProjectPathExists()', () => {
    it('leaves the configuration alone when stored value resolves to an existing path', async () => {
      const { service, repository } = build();
      (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
        value: '/tmp/x'
      });
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
      await service.checkIfRootProjectPathExists();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('updates the stored value when the path no longer exists', async () => {
      const { service, repository } = build();
      const stored = { value: '/old' };
      (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        stored
      );
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        false
      );
      (repository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined
      );
      await service.checkIfRootProjectPathExists();
      expect(stored.value).toBe('/tmp/projects');
      expect(repository.save).toHaveBeenCalledWith(stored);
    });

    it('upserts a new configuration row when none exists', async () => {
      const { service, repository } = build();
      (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const qb: Record<string, unknown> = {};
      qb.insert = vi.fn().mockReturnValue(qb);
      qb.into = vi.fn().mockReturnValue(qb);
      qb.values = vi.fn().mockReturnValue(qb);
      qb.orUpdate = vi.fn().mockReturnValue(qb);
      qb.execute = vi.fn().mockResolvedValue(undefined);
      (
        repository.createQueryBuilder as ReturnType<typeof vi.fn>
      ).mockReturnValue(qb);
      await service.checkIfRootProjectPathExists();
      expect(qb.values).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'rootPath', value: '/tmp/projects' })
      );
      expect(qb.execute).toHaveBeenCalledTimes(1);
    });
  });

  it('create() delegates to repository.create', () => {
    const { service, repository } = build();
    (repository.create as ReturnType<typeof vi.fn>).mockReturnValue({ id: 1 });
    const result = service.create({ name: 'a', value: 'b' } as never);
    expect(result).toEqual({ id: 1 });
  });

  it('findAll() returns all configurations', async () => {
    const { service, repository } = build();
    (repository.find as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1 }
    ]);
    expect(await service.findAll()).toEqual([{ id: 1 }]);
  });

  it('findOne() throws NOT_FOUND when no row exists', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.findOne(1)).rejects.toMatchObject({ status: 404 });
  });

  it('findOneByName() returns the configuration when found', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1
    });
    expect(await service.findOneByName('a')).toEqual({ id: 1 });
  });

  it('findOneByName() throws NOT_FOUND when missing', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.findOneByName('a')).rejects.toMatchObject({
      status: 404
    });
  });

  it('update() forwards the value criteria and id payload', async () => {
    const { service, repository } = build();
    (repository.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      affected: 1
    });
    await service.update(7, { value: 'v' } as never);
    expect(repository.update).toHaveBeenCalledWith({ value: 'v' }, { id: 7 });
  });

  it('remove() deletes by id', async () => {
    const { service, repository } = build();
    (repository.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
      affected: 1
    });
    await service.remove(7);
    expect(repository.delete).toHaveBeenCalledWith({ id: 7 });
  });

  it('getRootProjectPath() returns the configured root path value', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      value: '/root'
    });
    expect(await service.getRootProjectPath()).toBe('/root');
  });

  it('getRootProjectPath() throws NOT_FOUND when missing', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.getRootProjectPath()).rejects.toMatchObject({
      status: 404
    });
  });

  it('getCurrentProjectPath() returns the configuration entity', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      value: '/cur'
    });
    expect(await service.getCurrentProjectPath()).toEqual({
      id: 1,
      value: '/cur'
    });
  });

  it('getCurrentProjectPath() throws NOT_FOUND when missing', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.getCurrentProjectPath()).rejects.toMatchObject({
      status: 404
    });
  });
});
