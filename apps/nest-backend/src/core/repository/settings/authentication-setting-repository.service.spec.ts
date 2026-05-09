import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticationSettingRepositoryService } from './authentication-setting-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    save: vi.fn()
  };
  const service = new AuthenticationSettingRepositoryService(
    repository as never
  );
  return { service, repository };
}

describe('AuthenticationSettingRepositoryService', () => {
  it('get() returns a DTO for the requested id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({
      id: 1,
      username: 'u',
      password: 'p'
    });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toMatchObject({ id: 1 });
  });

  it('create() persists a new credential bound to the project', async () => {
    const { service, repository } = build();
    const project = { id: 3, projectSlug: 'demo' } as never;
    repository.save.mockImplementation(async (entity) => ({
      id: 99,
      ...entity
    }));
    const result = await service.create(project, {
      username: 'u',
      password: 'p'
    } as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.project).toBe(project);
    expect(saved.username).toBe('u');
    expect(saved.password).toBe('p');
    expect(result).toBeDefined();
  });

  it('update() merges and saves the existing setting when found', async () => {
    const { service, repository } = build();
    const project = { id: 4, projectSlug: 'demo' } as never;
    repository.findOne.mockResolvedValue({ id: 7, username: 'old' });
    repository.save.mockImplementation(async (entity) => entity);
    await service.update(project, { username: 'new', password: 'p2' } as never);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        project,
        username: 'new',
        password: 'p2'
      })
    );
  });

  it('update() throws when the setting does not exist', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.update({ id: 4, projectSlug: 'demo' } as never, {} as never)
    ).rejects.toMatchObject({ status: HttpStatus.INTERNAL_SERVER_ERROR });
  });

  it('update() wraps save failures into an HttpException', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    repository.save.mockRejectedValue(new Error('boom'));
    await expect(
      service.update({ id: 1, projectSlug: 'demo' } as never, {} as never)
    ).rejects.toBeInstanceOf(HttpException);
  });
});
