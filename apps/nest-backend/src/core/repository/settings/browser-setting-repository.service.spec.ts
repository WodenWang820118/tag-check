import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BrowserSettingRepositoryService } from './browser-setting-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    save: vi.fn()
  };
  const service = new BrowserSettingRepositoryService(repository as never);
  return { service, repository };
}

describe('BrowserSettingRepositoryService', () => {
  it('get() returns a DTO for the requested id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({
      id: 1,
      browser: 'chrome',
      headless: true
    });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toMatchObject({ id: 1 });
  });

  it('create() persists a new browser setting bound to the project', async () => {
    const { service, repository } = build();
    const project = { id: 2 } as never;
    repository.save.mockImplementation(async (entity) => ({
      id: 11,
      ...entity
    }));
    await service.create(project, {
      browser: 'chrome',
      headless: false
    } as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.project).toBe(project);
    expect(saved.browser).toBe('chrome');
    expect(saved.headless).toBe(false);
  });

  it('update() merges updates into the existing setting', async () => {
    const { service, repository } = build();
    const project = { id: 4 } as never;
    repository.findOne.mockResolvedValue({
      id: 7,
      browser: 'chrome',
      headless: true
    });
    repository.save.mockImplementation(async (entity) => entity);
    await service.update(project, { headless: false } as never);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        project,
        browser: 'chrome',
        headless: false
      })
    );
  });

  it('update() throws when no setting exists', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.update({ id: 1 } as never, {} as never)
    ).rejects.toMatchObject({ status: HttpStatus.INTERNAL_SERVER_ERROR });
  });

  it('update() wraps save failures into an HttpException', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    repository.save.mockRejectedValue(new Error('db'));
    await expect(
      service.update({ id: 1 } as never, {} as never)
    ).rejects.toBeInstanceOf(HttpException);
  });
});
