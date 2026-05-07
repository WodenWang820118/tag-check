import { HttpClient } from '@angular/common/http';
import { ProjectSchema } from '@utils';
import { firstValueFrom, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { ProjectService } from './project-info.service';

describe('ProjectService', () => {
  const seededProject: ProjectSchema = {
    id: 1,
    projectName: 'Example Project',
    projectSlug: 'example-project',
    createdAt: new Date('2026-01-01T00:00:00.000Z')
  };

  let httpClient: { get: ReturnType<typeof vi.fn> };
  let service: ProjectService;

  beforeEach(() => {
    httpClient = {
      get: vi.fn()
    };
    service = new ProjectService(httpClient as unknown as HttpClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retries an empty startup list before resolving seeded projects', async () => {
    vi.useFakeTimers();
    httpClient.get
      .mockReturnValueOnce(of([]))
      .mockReturnValueOnce(of([seededProject]));

    const resolvedProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    expect(httpClient.get).toHaveBeenCalledWith(environment.projectApiUrl);
    expect(httpClient.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(299);

    expect(httpClient.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    await expect(resolvedProjects).resolves.toEqual([seededProject]);
    expect(httpClient.get).toHaveBeenCalledTimes(2);
  });

  it('shares an in-flight startup check between subscribers', async () => {
    vi.useFakeTimers();
    httpClient.get
      .mockReturnValueOnce(of([]))
      .mockReturnValueOnce(of([seededProject]));

    const firstSubscriberProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );
    const secondSubscriberProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    expect(httpClient.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300);

    await expect(firstSubscriberProjects).resolves.toEqual([seededProject]);
    await expect(secondSubscriberProjects).resolves.toEqual([seededProject]);
    expect(httpClient.get).toHaveBeenCalledTimes(2);
  });

  it('resolves an empty list after exhausting the startup retry window', async () => {
    vi.useFakeTimers();
    httpClient.get.mockReturnValue(of([]));

    const resolvedProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    expect(httpClient.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2699);

    expect(httpClient.get).toHaveBeenCalledTimes(9);

    await vi.advanceTimersByTimeAsync(1);

    await expect(resolvedProjects).resolves.toEqual([]);
    expect(httpClient.get).toHaveBeenCalledTimes(10);

    await vi.advanceTimersByTimeAsync(300);

    expect(httpClient.get).toHaveBeenCalledTimes(10);
  });

  it('does not retry empty lists after the startup check completes', async () => {
    vi.useFakeTimers();
    httpClient.get.mockReturnValue(of([]));

    const startupProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    await vi.advanceTimersByTimeAsync(2700);

    await expect(startupProjects).resolves.toEqual([]);
    expect(httpClient.get).toHaveBeenCalledTimes(10);

    const laterProjects = firstValueFrom(service.getProjectsAfterStartupSeed());

    await expect(laterProjects).resolves.toEqual([]);
    expect(httpClient.get).toHaveBeenCalledTimes(11);

    await vi.advanceTimersByTimeAsync(300);

    expect(httpClient.get).toHaveBeenCalledTimes(11);
  });

  it('leaves the startup check open when the initial request fails', async () => {
    httpClient.get
      .mockReturnValueOnce(
        throwError(() => new Error('Project list unavailable'))
      )
      .mockReturnValueOnce(of([seededProject]));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const failedStartupProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    await expect(failedStartupProjects).rejects.toThrow(
      'Project list unavailable'
    );
    expect(httpClient.get).toHaveBeenCalledTimes(1);

    await expect(
      firstValueFrom(service.getProjectsAfterStartupSeed())
    ).resolves.toEqual([seededProject]);
    expect(httpClient.get).toHaveBeenCalledTimes(2);
  });

  it('leaves the startup check open when a retry request fails', async () => {
    vi.useFakeTimers();
    httpClient.get
      .mockReturnValueOnce(of([]))
      .mockReturnValueOnce(
        throwError(() => new Error('Project list unavailable'))
      )
      .mockReturnValueOnce(of([seededProject]));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const failedStartupProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    await vi.advanceTimersByTimeAsync(300);

    await expect(failedStartupProjects).rejects.toThrow(
      'Project list unavailable'
    );
    expect(httpClient.get).toHaveBeenCalledTimes(2);

    await expect(
      firstValueFrom(service.getProjectsAfterStartupSeed())
    ).resolves.toEqual([seededProject]);
    expect(httpClient.get).toHaveBeenCalledTimes(3);
  });
});
