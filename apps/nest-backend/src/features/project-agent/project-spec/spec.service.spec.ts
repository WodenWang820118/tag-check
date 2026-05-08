import { describe, expect, it, vi } from 'vitest';
import { SpecService } from './spec.service';

function build() {
  const repository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
  const service = new SpecService(repository as never);
  return { service, repository };
}

describe('SpecService', () => {
  it('getSpecs() returns all rows from the repository', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }]);
    expect(await service.getSpecs()).toEqual([{ id: 1 }]);
  });

  it('getSpecById() looks up by numeric id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 7 });
    const result = await service.getSpecById(7);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(result).toEqual({ id: 7 });
  });

  it('getSpecByEvent() looks up by event name', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, eventName: 'click' });
    await service.getSpecByEvent('click');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { eventName: 'click' }
    });
  });

  it('addSpec() creates and saves a new spec entity', async () => {
    const { service, repository } = build();
    repository.create.mockReturnValue({ eventName: 'x' });
    repository.save.mockResolvedValue({ id: 1, eventName: 'x' });
    const result = await service.addSpec({ eventName: 'x' } as never);
    expect(repository.create).toHaveBeenCalledWith({ eventName: 'x' });
    expect(result).toEqual({ id: 1, eventName: 'x' });
  });

  it('updateSpec() forwards to repository.update then re-fetches via getSpecById', async () => {
    const { service, repository } = build();
    repository.update.mockResolvedValue({ affected: 1 });
    repository.findOne.mockResolvedValue({ id: 7, eventName: 'updated' });
    const result = await service.updateSpec(7, {
      eventName: 'updated'
    } as never);
    expect(repository.update).toHaveBeenCalledWith(7, { eventName: 'updated' });
    expect(result).toEqual({ id: 7, eventName: 'updated' });
  });

  it('deleteSpec() removes by id', async () => {
    const { service, repository } = build();
    repository.delete.mockResolvedValue({ affected: 1 });
    await service.deleteSpec(7);
    expect(repository.delete).toHaveBeenCalledWith(7);
  });
});
