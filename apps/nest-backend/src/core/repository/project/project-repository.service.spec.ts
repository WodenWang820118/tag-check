import { describe, expect, it, vi } from 'vitest';
import { ProjectRepositoryService } from './project-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
  const service = new ProjectRepositoryService(repository as never);
  return { service, repository };
}

describe('ProjectRepositoryService', () => {
  it('get() returns a DTO for the requested numeric id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, projectSlug: 'demo' });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toMatchObject({ id: 1 });
  });

  it('list() returns DTOs for all projects', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await service.list();
    expect(result).toHaveLength(2);
  });

  it('getBySlug() delegates to getEntityBySlug and returns a DTO', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, projectSlug: 'demo' });
    const result = await service.getBySlug('demo');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { projectSlug: 'demo' }
    });
    expect(result).toMatchObject({ id: 1 });
  });

  it('getEntityBySlug() throws NOT_FOUND when the project does not exist', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(null);
    await expect(service.getEntityBySlug('missing')).rejects.toMatchObject({
      status: 404
    });
  });

  it('getSettingBySlug() loads project relations and returns a DTO', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, projectSlug: 'demo' });
    await service.getSettingBySlug('demo');
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: {
          authenticationSettings: true,
          browserSettings: true,
          applicationSettings: true
        },
        where: { projectSlug: 'demo' }
      })
    );
  });

  it('create() persists the new project and returns a DTO', async () => {
    const { service, repository } = build();
    repository.save.mockResolvedValue({ id: 9, projectSlug: 'new' });
    const result = await service.create({ projectSlug: 'new' } as never);
    expect(repository.save).toHaveBeenCalledWith({ projectSlug: 'new' });
    expect(result).toMatchObject({ id: 9 });
  });

  it('update() forwards the data to the repository update', async () => {
    const { service, repository } = build();
    repository.update.mockResolvedValue({ affected: 1 });
    await service.update(1, { projectName: 'new' } as never);
    expect(repository.update).toHaveBeenCalledWith(1, { projectName: 'new' });
  });

  it('deleteBySlug() removes by slug', async () => {
    const { service, repository } = build();
    repository.delete.mockResolvedValue({ affected: 1 });
    await service.deleteBySlug('demo');
    expect(repository.delete).toHaveBeenCalledWith({ projectSlug: 'demo' });
  });

  it('getGtmConfigBySlug() returns the gtmConfigurationPath of the resolved project', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({
      id: 1,
      gtmConfigurationPath: '/cfg.json'
    });
    const result = await service.getGtmConfigBySlug('demo');
    expect(result).toBe('/cfg.json');
  });
});
