import { HttpClient } from '@angular/common/http';
import { ProjectSchema } from '@utils';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { ProjectService } from './project-info.service';

type StartupProjectSeedReadiness = {
  ready: boolean;
  projectCount: number;
};

describe('ProjectService', () => {
  const seededProject: ProjectSchema = {
    id: 1,
    projectName: 'Example Project',
    projectSlug: 'example-project',
    createdAt: new Date('2026-01-01T00:00:00.000Z')
  };
  const projectSeedReadinessUrl = environment.startupProjectSeedReadinessApiUrl;
  const projectListUrl = environment.projectApiUrl;
  const notReady: StartupProjectSeedReadiness = {
    ready: false,
    projectCount: 0
  };
  const ready = (projectCount = 1): StartupProjectSeedReadiness => ({
    ready: true,
    projectCount
  });

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

  const callsFor = (url: string): number =>
    httpClient.get.mock.calls.filter(([calledUrl]) => calledUrl === url).length;

  const mockApiResponses = ({
    readiness,
    projects
  }: {
    readiness: Observable<StartupProjectSeedReadiness>[];
    projects: Observable<ProjectSchema[]>[];
  }): void => {
    const readinessQueue = [...readiness];
    const projectQueue = [...projects];
    const finalReadiness = readiness[readiness.length - 1] ?? of(notReady);
    const finalProjects = projects[projects.length - 1] ?? of([]);

    httpClient.get.mockImplementation((url: string) => {
      if (url === projectSeedReadinessUrl) {
        return readinessQueue.shift() ?? finalReadiness;
      }

      if (url === projectListUrl) {
        return projectQueue.shift() ?? finalProjects;
      }

      return throwError(() => new Error(`Unexpected URL: ${url}`));
    });
  };

  it('waits for startup seed readiness before requesting projects', async () => {
    vi.useFakeTimers();
    mockApiResponses({
      readiness: [of(notReady), of(ready())],
      projects: [of([seededProject])]
    });

    const resolvedProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(0);

    await vi.advanceTimersByTimeAsync(999);

    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(0);

    await vi.advanceTimersByTimeAsync(1);

    await expect(resolvedProjects).resolves.toEqual([seededProject]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(2);
    expect(callsFor(projectListUrl)).toBe(1);
  });

  it('shares an in-flight startup check between subscribers', async () => {
    vi.useFakeTimers();
    mockApiResponses({
      readiness: [of(notReady), of(ready())],
      projects: [of([seededProject])]
    });

    const firstSubscriberProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );
    const secondSubscriberProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(0);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(firstSubscriberProjects).resolves.toEqual([seededProject]);
    await expect(secondSubscriberProjects).resolves.toEqual([seededProject]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(2);
    expect(callsFor(projectListUrl)).toBe(1);
  });

  it('retries an empty project list after seed readiness before resolving seeded projects', async () => {
    vi.useFakeTimers();
    mockApiResponses({
      readiness: [of(ready())],
      projects: [of([]), of([seededProject])]
    });

    const resolvedProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(1);

    await vi.advanceTimersByTimeAsync(299);

    expect(callsFor(projectListUrl)).toBe(1);

    await vi.advanceTimersByTimeAsync(1);

    await expect(resolvedProjects).resolves.toEqual([seededProject]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(2);
  });

  it('does not retry empty lists after a successful startup check completes', async () => {
    mockApiResponses({
      readiness: [of(ready())],
      projects: [of([seededProject]), of([])]
    });

    await expect(
      firstValueFrom(service.getProjectsAfterStartupSeed())
    ).resolves.toEqual([seededProject]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(1);

    await expect(
      firstValueFrom(service.getProjectsAfterStartupSeed())
    ).resolves.toEqual([]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(2);
  });

  it('leaves startup check open when seed readiness never reports a visible project', async () => {
    vi.useFakeTimers();
    mockApiResponses({
      readiness: [of(notReady)],
      projects: [of([seededProject])]
    });

    const failedStartupProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    await vi.advanceTimersByTimeAsync(59000);

    await expect(failedStartupProjects).rejects.toThrow(
      'Startup project seed did not become ready'
    );
    expect(callsFor(projectSeedReadinessUrl)).toBe(60);
    expect(callsFor(projectListUrl)).toBe(0);

    httpClient.get.mockClear();
    mockApiResponses({
      readiness: [of(ready())],
      projects: [of([seededProject])]
    });

    await expect(
      firstValueFrom(service.getProjectsAfterStartupSeed())
    ).resolves.toEqual([seededProject]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(1);
  });

  it('leaves startup check open when project list remains empty after seed readiness', async () => {
    vi.useFakeTimers();
    mockApiResponses({
      readiness: [of(ready())],
      projects: [of([])]
    });

    const failedStartupProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    await vi.advanceTimersByTimeAsync(2700);

    await expect(failedStartupProjects).rejects.toThrow(
      'Startup project list remained empty'
    );
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(10);

    httpClient.get.mockClear();
    mockApiResponses({
      readiness: [of(ready())],
      projects: [of([seededProject])]
    });

    await expect(
      firstValueFrom(service.getProjectsAfterStartupSeed())
    ).resolves.toEqual([seededProject]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(1);
  });

  it('leaves startup check open when a project-list retry request fails', async () => {
    vi.useFakeTimers();
    mockApiResponses({
      readiness: [of(ready())],
      projects: [
        of([]),
        throwError(() => new Error('Project list unavailable'))
      ]
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const failedStartupProjects = firstValueFrom(
      service.getProjectsAfterStartupSeed()
    );

    await vi.advanceTimersByTimeAsync(300);

    await expect(failedStartupProjects).rejects.toThrow(
      'Project list unavailable'
    );
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(2);

    httpClient.get.mockClear();
    mockApiResponses({
      readiness: [of(ready())],
      projects: [of([seededProject])]
    });

    await expect(
      firstValueFrom(service.getProjectsAfterStartupSeed())
    ).resolves.toEqual([seededProject]);
    expect(callsFor(projectSeedReadinessUrl)).toBe(1);
    expect(callsFor(projectListUrl)).toBe(1);
  });
});
