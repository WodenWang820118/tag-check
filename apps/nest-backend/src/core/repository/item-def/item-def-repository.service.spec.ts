import { describe, expect, it, vi } from 'vitest';
import { ItemDefRepositoryService } from './item-def-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
  const service = new ItemDefRepositoryService(repository as never);
  return { service, repository };
}

describe('ItemDefRepositoryService', () => {
  it('get() returns a DTO for the numeric id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, itemId: 'i' });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBeDefined();
  });

  it('getItemDefById() looks up by itemId', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, itemId: 'iid' });
    await service.getItemDefById('iid');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { itemId: 'iid' }
    });
  });

  it('getItemDefByTemplateName() looks up by templateName', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, templateName: 't' });
    await service.getItemDefByTemplateName('t');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { templateName: 't' }
    });
  });

  it('list() returns all item defs as DTOs', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await service.list();
    expect(result).toHaveLength(2);
  });

  it('create() persists a new item def bound to the test event', async () => {
    const { service, repository } = build();
    const testEvent = { id: 3 } as never;
    repository.save.mockResolvedValue(undefined);
    await service.create(testEvent, {
      fullItemDef: 'def',
      templateName: 'tpl',
      itemId: 'iid'
    } as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.testEvent).toBe(testEvent);
    expect(saved.fullItemDef).toBe('def');
    expect(saved.templateName).toBe('tpl');
    expect(saved.itemId).toBe('iid');
  });

  it('update() updates by id and returns the refreshed entity', async () => {
    const { service, repository } = build();
    repository.update.mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({ id: 1, itemId: 'iid' });
    const result = await service.update(1, { itemId: 'iid' } as never);
    expect(repository.update).toHaveBeenCalledWith(1, { itemId: 'iid' });
    expect(result).toBeDefined();
  });

  it('updateItemDefById() updates by itemId and returns the refreshed entity', async () => {
    const { service, repository } = build();
    repository.update.mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({ id: 2, itemId: 'iid' });
    const result = await service.updateItemDefById('iid', {
      templateName: 'x'
    } as never);
    expect(repository.update).toHaveBeenCalledWith(
      { itemId: 'iid' },
      { templateName: 'x' }
    );
    expect(result).toBeDefined();
  });

  it('delete() removes the entity by id', async () => {
    const { service, repository } = build();
    repository.delete.mockResolvedValue(undefined);
    await service.delete(7);
    expect(repository.delete).toHaveBeenCalledWith(7);
  });
});
