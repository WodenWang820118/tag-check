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
  it('addSpec() creates and saves a new spec entity', async () => {
    const { service, repository } = build();
    repository.create.mockReturnValue({ eventName: 'x' });
    repository.save.mockResolvedValue({ id: 1, eventName: 'x' });
    const result = await service.addSpec({ eventName: 'x' } as never);
    expect(repository.create).toHaveBeenCalledWith({ eventName: 'x' });
    expect(result).toEqual({ id: 1, eventName: 'x' });
  });
});
