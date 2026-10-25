import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Project } from '@utils';
import { ProjectIoService } from '../../../../shared/services/api/project-io/project-io.service';
import { ProjectItemComponent } from './project-item.component';

describe('ProjectItemComponent', () => {
  it('asks before deleting the project, with the question in the dialog', () => {
    const open = vi.fn(() => ({ afterClosed: () => of(false) }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: { open } },
        { provide: ProjectIoService, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(ProjectItemComponent);
    // One project of GET /projects.
    fixture.componentRef.setInput(
      'project',
      JSON.parse(
        JSON.stringify({
          id: 2,
          projectSlug: 'shop',
          projectName: 'Shop',
          projectDescription: '',
          measurementId: '',
          createdAt: '2026-10-21T06:18:46.000Z'
        })
      ) as Project
    );

    fixture.componentInstance.deleteProject();

    expect(open).toHaveBeenCalledWith(expect.anything(), {
      data: expect.objectContaining({
        title: 'Delete project',
        contents: 'Are you sure you want to delete this project?'
      })
    });
  });
});
