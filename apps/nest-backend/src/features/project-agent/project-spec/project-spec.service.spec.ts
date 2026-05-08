import { NotAcceptableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectSpecService } from './project-spec.service';

function build() {
  const specRepositoryService = { list: vi.fn() };
  const specService = {
    getSpecByEvent: vi.fn(),
    addSpec: vi.fn(),
    updateSpec: vi.fn()
  };
  const service = new ProjectSpecService(
    specRepositoryService as never,
    specService as never
  );
  return { service, specRepositoryService, specService };
}

describe('ProjectSpecService', () => {
  it('getProjectSpecs() returns the project slug and only the dataLayerSpec entries', async () => {
    const { service, specRepositoryService } = build();
    specRepositoryService.list.mockResolvedValue([
      { dataLayerSpec: { event: 'a' } },
      { dataLayerSpec: { event: 'b' } }
    ]);
    const result = await service.getProjectSpecs('demo');
    expect(result).toEqual({
      projectSlug: 'demo',
      specs: [{ event: 'a' }, { event: 'b' }]
    });
  });

  it('getSpec() returns undefined when the lookup misses', async () => {
    const { service, specService } = build();
    specService.getSpecByEvent.mockResolvedValue(null);
    expect(await service.getSpec('demo', 'click')).toBeUndefined();
  });

  it('getSpec() returns the dataLayerSpec when found', async () => {
    const { service, specService } = build();
    specService.getSpecByEvent.mockResolvedValue({
      dataLayerSpec: { event: 'click' }
    });
    expect(await service.getSpec('demo', 'click')).toEqual({ event: 'click' });
  });

  it('addSpec() throws NotAcceptable when no eventName parameter is found in the rawGtmTag', async () => {
    const { service } = build();
    await expect(
      service.addSpec('demo', {
        dataLayerSpec: {},
        rawGtmTag: { tag: { parameter: [{ key: 'other', value: 'x' }] } }
      } as never)
    ).rejects.toBeInstanceOf(NotAcceptableException);
  });

  it('addSpec() persists the spec with the extracted event name and returns the project specs', async () => {
    const { service, specService, specRepositoryService } = build();
    specRepositoryService.list.mockResolvedValue([]);
    await service.addSpec('demo', {
      dataLayerSpec: { foo: 'bar' },
      rawGtmTag: { tag: { parameter: [{ key: 'eventName', value: 'click' }] } }
    } as never);
    expect(specService.addSpec).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'click', eventName: 'click' })
    );
  });

  it('updateSpec() throws NotAcceptable when the existing spec cannot be found', async () => {
    const { service, specService } = build();
    specService.getSpecByEvent.mockResolvedValue(null);
    await expect(
      service.updateSpec('demo', 'evt', { dataLayerSpec: {} } as never)
    ).rejects.toBeInstanceOf(NotAcceptableException);
  });

  it('updateSpec() forwards the numeric id to specService.updateSpec', async () => {
    const { service, specService, specRepositoryService } = build();
    specService.getSpecByEvent.mockResolvedValue({
      dataLayerSpec: { id: '11' }
    });
    specRepositoryService.list.mockResolvedValue([]);
    await service.updateSpec('demo', 'evt', {
      dataLayerSpec: { event: 'x' }
    } as never);
    expect(specService.updateSpec).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ eventName: 'evt' })
    );
  });
});
