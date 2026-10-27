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
    getROOT_PROJECT_PATH: vi.fn().mockReturnValue('/tmp/projects')
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

  it('create() saves the new entry', async () => {
    const { service, repository } = build();
    (repository.create as ReturnType<typeof vi.fn>).mockImplementation(
      (dto: object) => ({ ...dto })
    );
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(
      async (entity: object) => ({ id: 1, ...entity })
    );

    const result = await service.create({ name: 'a', value: 'b' });

    expect(repository.save).toHaveBeenCalledWith({ name: 'a', value: 'b' });
    expect(result).toEqual({ id: 1, name: 'a', value: 'b' });
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
  it('getValue() reads the value, or null without the entry', async () => {
    const { service, repository } = build();
    (repository.findOne as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ name: 'a', value: 'b' })
      .mockResolvedValueOnce(null);

    await expect(service.getValue('a')).resolves.toBe('b');
    await expect(service.getValue('missing')).resolves.toBeNull();
    expect(repository.findOne).toHaveBeenCalledWith({ where: { name: 'a' } });
  });

  it('setValue() creates the entry or replaces its value', async () => {
    const { service, repository } = build();
    const qb: Record<string, unknown> = {};
    qb.insert = vi.fn().mockReturnValue(qb);
    qb.into = vi.fn().mockReturnValue(qb);
    qb.values = vi.fn().mockReturnValue(qb);
    qb.orUpdate = vi.fn().mockReturnValue(qb);
    qb.execute = vi.fn().mockResolvedValue(undefined);
    (repository.createQueryBuilder as ReturnType<typeof vi.fn>).mockReturnValue(
      qb
    );

    await service.setValue('a', 'b', 'about a');

    expect(qb.values).toHaveBeenCalledWith({
      name: 'a',
      value: 'b',
      description: 'about a'
    });
    expect(qb.orUpdate).toHaveBeenCalledWith(
      ['value', 'description'],
      ['name']
    );
    expect(qb.execute).toHaveBeenCalledTimes(1);
  });
});
