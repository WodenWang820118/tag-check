import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Project } from '@utils';
import { MetadataSourceService } from '../../../../shared/services/data-source/metadata-source.service';
import { ProjectListFacadeService } from './project-list-facade.service';

/** Projects as GET /projects returns them. */
const PROJECTS = JSON.parse(
  JSON.stringify([
    {
      id: 1,
      projectSlug: 'ng-gtm-sample',
      projectName: 'Angular GTM sample',
      projectDescription: 'The example project',
      measurementId: 'G-8HKQR5ZBSK',
      createdAt: '2026-10-20T06:18:46.000Z',
      updatedAt: '2026-10-20T06:18:46.000Z'
    },
    {
      id: 2,
      projectSlug: 'shop',
      projectName: 'Shop',
      projectDescription: '',
      measurementId: '',
      createdAt: '2026-10-21T06:18:46.000Z',
      updatedAt: '2026-10-21T06:18:46.000Z'
    }
  ])
) as Project[];

describe('ProjectListFacadeService', () => {
  it('shows every project again once the search is cleared', () => {
    const metadata = TestBed.inject(MetadataSourceService);
    const facade = TestBed.inject(ProjectListFacadeService);
    metadata.setData(PROJECTS);
    const slugs = () => {
      facade.filteredProjects();
      return facade.dataSource.filteredData.map((p) => p.projectSlug);
    };

    metadata.setFilterSignal('Angular');
    expect(slugs()).toEqual(['ng-gtm-sample']);

    metadata.setFilterSignal('');
    expect(slugs()).toEqual(['ng-gtm-sample', 'shop']);
  });
});
