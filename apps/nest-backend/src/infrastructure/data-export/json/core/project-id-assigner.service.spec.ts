import { describe, expect, it } from 'vitest';
import { ProjectIdAssignerService } from './project-id-assigner.service';

describe('ProjectIdAssignerService', () => {
  const service = new ProjectIdAssignerService();

  it('assigns the new projectId on non-ProjectEntity rows that already have a projectId column', () => {
    const materialized: Record<string, unknown> = { id: 1, projectId: 'old' };
    service.assignIfApplicable({
      materialized,
      meta: { name: 'TagEntity' } as never,
      newProjectId: 'new-id'
    });
    expect(materialized['projectId']).toBe('new-id');
  });

  it('leaves rows untouched when the materialized row has no projectId column', () => {
    const materialized: Record<string, unknown> = { id: 1 };
    service.assignIfApplicable({
      materialized,
      meta: { name: 'TagEntity' } as never,
      newProjectId: 'new-id'
    });
    expect('projectId' in materialized).toBe(false);
  });

  it('does not overwrite the projectId on a ProjectEntity row itself', () => {
    const materialized: Record<string, unknown> = { projectId: 'self' };
    service.assignIfApplicable({
      materialized,
      meta: { name: 'ProjectEntity' } as never,
      newProjectId: 'new-id'
    });
    expect(materialized['projectId']).toBe('self');
  });

  it('does not throw when newProjectId is null and the row is non-ProjectEntity', () => {
    const materialized: Record<string, unknown> = { projectId: 'old' };
    expect(() =>
      service.assignIfApplicable({
        materialized,
        meta: { name: 'TagEntity' } as never,
        newProjectId: null
      })
    ).not.toThrow();
    expect(materialized['projectId']).toBe('old');
  });
});
