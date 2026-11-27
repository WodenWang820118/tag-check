import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Project } from '@utils';
import { ProjectIoService } from '../../../../shared/services/api/project-io/project-io.service';
import { MetadataSourceService } from '../../../../shared/services/data-source/metadata-source.service';
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

  it('deletes the project and drops its card once the dialog is confirmed', async () => {
    const projects = JSON.parse(
      JSON.stringify([
        { id: 1, projectSlug: 'blog', projectName: 'Blog' },
        { id: 2, projectSlug: 'shop', projectName: 'Shop' }
      ])
    ) as Project[];
    const deleteProject = vi.fn(() => of(null));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of(true) }) }
        },
        { provide: ProjectIoService, useValue: { deleteProject } }
      ]
    });
    const metadata = TestBed.inject(MetadataSourceService);
    metadata.setData(projects);
    const fixture = TestBed.createComponent(ProjectItemComponent);
    fixture.componentRef.setInput('project', projects[1]);

    await fixture.componentInstance.deleteProject();

    expect(deleteProject).toHaveBeenCalledWith('shop');
    let remaining: Project[] = [];
    metadata
      .getData()
      .subscribe((data) => (remaining = data))
      .unsubscribe();
    expect(remaining.map((project) => project.projectSlug)).toEqual(['blog']);
  });

  it('logs a failed delete instead of throwing', async () => {
    const error = new Error('locked');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of(true) }) }
        },
        {
          provide: ProjectIoService,
          useValue: { deleteProject: () => throwError(() => error) }
        }
      ]
    });
    TestBed.inject(MetadataSourceService).setData([]);
    const fixture = TestBed.createComponent(ProjectItemComponent);
    fixture.componentRef.setInput(
      'project',
      JSON.parse(JSON.stringify({ id: 2, projectSlug: 'shop' })) as Project
    );

    await fixture.componentInstance.deleteProject();

    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });
});
