import { describe, expect, it, vi } from 'vitest';
import { ProjectFacadeRepositoryService } from './project-facade-repository.service';

function build() {
  const projectRepositoryService = {
    create: vi.fn(),
    getEntityBySlug: vi.fn(),
    update: vi.fn()
  };
  const authenticationRepositoryService = { create: vi.fn(), update: vi.fn() };
  const browserRepositoryService = { create: vi.fn(), update: vi.fn() };
  const applicationRepositoryService = { create: vi.fn(), update: vi.fn() };
  const specRepositoryService = { update: vi.fn() };
  const service = new ProjectFacadeRepositoryService(
    projectRepositoryService as never,
    authenticationRepositoryService as never,
    browserRepositoryService as never,
    applicationRepositoryService as never,
    specRepositoryService as never
  );
  return {
    service,
    projectRepositoryService,
    authenticationRepositoryService,
    browserRepositoryService,
    applicationRepositoryService,
    specRepositoryService
  };
}

describe('ProjectFacadeRepositoryService', () => {
  it('createProject() persists the project then creates default app/auth/browser settings against the resolved entity', async () => {
    const ctx = build();
    const projectEntity = { id: 1, projectSlug: 'demo' };
    ctx.projectRepositoryService.create.mockResolvedValue({ id: 1 });
    ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue(
      projectEntity
    );
    ctx.applicationRepositoryService.create.mockResolvedValue({});
    ctx.authenticationRepositoryService.create.mockResolvedValue({});
    ctx.browserRepositoryService.create.mockResolvedValue({});

    const result = await ctx.service.createProject({
      projectSlug: 'demo'
    } as never);

    expect(ctx.projectRepositoryService.create).toHaveBeenCalledWith({
      projectSlug: 'demo'
    });
    expect(ctx.applicationRepositoryService.create).toHaveBeenCalledWith(
      projectEntity,
      expect.objectContaining({
        localStorage: { data: [] },
        cookie: { data: [] }
      })
    );
    expect(ctx.authenticationRepositoryService.create).toHaveBeenCalledWith(
      projectEntity,
      expect.objectContaining({ username: '', password: '' })
    );
    expect(ctx.browserRepositoryService.create).toHaveBeenCalledWith(
      projectEntity,
      expect.objectContaining({ headless: true, browser: [] })
    );
    expect(result).toEqual({ id: 1 });
  });

  it('updateProjectSettings() updates the project entity by id', async () => {
    const ctx = build();
    ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 5 });
    ctx.projectRepositoryService.update.mockResolvedValue({ affected: 1 });
    await ctx.service.updateProjectSettings('demo', { name: 'new' } as never);
    expect(ctx.projectRepositoryService.update).toHaveBeenCalledWith(5, {
      name: 'new'
    });
  });

  it('updateApplicationSettings() throws when settings are falsy', async () => {
    const { service } = build();
    await expect(
      service.updateApplicationSettings('demo', null as never)
    ).rejects.toThrow('Invalid settings');
  });

  it('updateApplicationSettings() throws when projectSlug is empty', async () => {
    const { service } = build();
    await expect(
      service.updateApplicationSettings('', { gtm: {} } as never)
    ).rejects.toThrow('Invalid projectSlug');
  });

  it('updateApplicationSettings() resolves the project then forwards to the application repo update', async () => {
    const ctx = build();
    ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 5 });
    ctx.applicationRepositoryService.update.mockResolvedValue({ id: 1 });
    await ctx.service.updateApplicationSettings('demo', { gtm: {} } as never);
    expect(ctx.applicationRepositoryService.update).toHaveBeenCalledWith(
      { id: 5 },
      { gtm: {} }
    );
  });

  it('updateAuthenticationSettings() forwards to the authentication repo update with the resolved project', async () => {
    const ctx = build();
    ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 5 });
    await ctx.service.updateAuthenticationSettings('demo', {
      username: 'u'
    } as never);
    expect(ctx.authenticationRepositoryService.update).toHaveBeenCalledWith(
      { id: 5 },
      { username: 'u' }
    );
  });

  it('updateBrowserSettings() forwards to the browser repo update with the resolved project', async () => {
    const ctx = build();
    ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 5 });
    await ctx.service.updateBrowserSettings('demo', {
      headless: false
    } as never);
    expect(ctx.browserRepositoryService.update).toHaveBeenCalledWith(
      { id: 5 },
      { headless: false }
    );
  });

  it('updateSpec() delegates to the spec repository update', async () => {
    const ctx = build();
    ctx.specRepositoryService.update.mockResolvedValue({});
    await ctx.service.updateSpec('demo', 'evt', { dataLayerSpec: {} } as never);
    expect(ctx.specRepositoryService.update).toHaveBeenCalledWith(
      'demo',
      'evt',
      {
        dataLayerSpec: {}
      }
    );
  });
});
