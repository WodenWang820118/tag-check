import { describe, expect, it, vi } from 'vitest';
import { SpecController } from './spec.controller';

describe('SpecController', () => {
  function build() {
    const projectSpecService = {
      getProjectSpecs: vi.fn().mockResolvedValue(['spec-a']),
      addSpec: vi.fn().mockResolvedValue('added')
    };
    const projectFacadeRepositoryService = {
      updateSpec: vi.fn().mockResolvedValue('spec-updated')
    };
    const specRepositoryService = {
      getSpecByProjectSlugAndEventId: vi
        .fn()
        .mockResolvedValue({ event: 'view_item' })
    };
    const itemDefRepositoryService = {
      getItemDefById: vi.fn().mockResolvedValue({ id: 'item-1' }),
      getItemDefByTemplateName: vi
        .fn()
        .mockResolvedValue({ template: 'tpl-1' }),
      updateItemDefById: vi.fn().mockResolvedValue('item-updated')
    };
    const controller = new SpecController(
      projectSpecService as never,
      projectFacadeRepositoryService as never,
      specRepositoryService as never,
      itemDefRepositoryService as never
    );
    return {
      controller,
      projectSpecService,
      projectFacadeRepositoryService,
      specRepositoryService,
      itemDefRepositoryService
    };
  }

  it('getProjectSpecs delegates to ProjectSpecService.getProjectSpecs', async () => {
    const { controller, projectSpecService } = build();
    const result = await controller.getProjectSpecs('proj-1');
    expect(projectSpecService.getProjectSpecs).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual(['spec-a']);
  });

  it('getItemDef delegates to ItemDefRepositoryService.getItemDefById', async () => {
    const { controller, itemDefRepositoryService } = build();
    const result = await controller.getItemDef('item-1');
    expect(itemDefRepositoryService.getItemDefById).toHaveBeenCalledWith(
      'item-1'
    );
    expect(result).toEqual({ id: 'item-1' });
  });

  it('getItemDef falls back to getItemDefByTemplateName when ID lookup returns null', async () => {
    const { controller, itemDefRepositoryService } = build();
    itemDefRepositoryService.getItemDefById.mockResolvedValue(null);
    const result = await controller.getItemDef('tpl-1');
    expect(itemDefRepositoryService.getItemDefById).toHaveBeenCalledWith(
      'tpl-1'
    );
    expect(
      itemDefRepositoryService.getItemDefByTemplateName
    ).toHaveBeenCalledWith('tpl-1');
    expect(result).toEqual({ template: 'tpl-1' });
  });

  it('updateItemDef delegates to ItemDefRepositoryService.updateItemDefById', async () => {
    const { controller, itemDefRepositoryService } = build();
    const dto = { templateName: 'new' } as never;
    const result = await controller.updateItemDef('item-1', dto);
    expect(itemDefRepositoryService.updateItemDefById).toHaveBeenCalledWith(
      'item-1',
      dto
    );
    expect(result).toBe('item-updated');
  });

  it('getSpec delegates to SpecRepositoryService.getSpecByProjectSlugAndEventId', async () => {
    const { controller, specRepositoryService } = build();
    const result = await controller.getSpec('proj-1', 'evt-1');
    expect(
      specRepositoryService.getSpecByProjectSlugAndEventId
    ).toHaveBeenCalledWith('proj-1', 'evt-1');
    expect(result).toEqual({ event: 'view_item' });
  });

  it('addSpec delegates to ProjectSpecService.addSpec', async () => {
    const { controller, projectSpecService } = build();
    const dto = { event: 'view_item' } as never;
    const result = await controller.addSpec('proj-1', dto);
    expect(projectSpecService.addSpec).toHaveBeenCalledWith('proj-1', dto);
    expect(result).toBe('added');
  });

  it('updateSpec delegates to ProjectFacadeRepositoryService.updateSpec', async () => {
    const { controller, projectFacadeRepositoryService } = build();
    const dto = { event: 'updated' } as never;
    const result = await controller.updateSpec('proj-1', 'evt-1', dto);
    expect(projectFacadeRepositoryService.updateSpec).toHaveBeenCalledWith(
      'proj-1',
      'evt-1',
      dto
    );
    expect(result).toBe('spec-updated');
  });
});
