import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import { InitProjectFormFacadeService } from './init-project-form-facade.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
class MockErrorDialogComponent {}

describe('InitProjectFormFacadeService', () => {
  let configurationService: { getConfiguration: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let projectService: { initProject: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let service: InitProjectFormFacadeService;

  beforeEach(() => {
    TestBed.resetTestingModule();

    configurationService = {
      getConfiguration: vi.fn()
    };
    dialog = {
      open: vi.fn()
    };
    projectService = {
      initProject: vi.fn()
    };
    router = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    TestBed.configureTestingModule({
      providers: [
        InitProjectFormFacadeService,
        {
          provide: ConfigurationService,
          useValue: configurationService
        },
        {
          provide: MatDialog,
          useValue: dialog
        },
        {
          provide: ProjectService,
          useValue: projectService
        },
        {
          provide: Router,
          useValue: router
        }
      ]
    });

    service = TestBed.inject(InitProjectFormFacadeService);
    service.errorDialogComponent = Promise.resolve(MockErrorDialogComponent);
  });

  it('generates a slug when the project name changes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    service.projectForm.projectName().value.set('Corporate Website');
    TestBed.flushEffects();

    expect(service.projectForm.projectSlug().value()).toMatch(
      /^corporate-website-[a-z0-9]{4}$/
    );
  });

  it('normalizes whitespace and invalid symbols when generating a slug', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    service.projectForm.projectName().value.set('  Test  Project!!  ');
    TestBed.flushEffects();

    expect(service.projectForm.projectSlug().value()).toMatch(
      /^test-project-[a-z0-9]{4}$/
    );
  });

  it('guards against duplicate project-name subscriptions', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    const projectSlugSetSpy = vi.spyOn(
      service.projectForm.projectSlug().value,
      'set'
    );

    service.observeProjectNameChanges();
    service.projectForm.projectName().value.set('Single Observer');
    TestBed.flushEffects();

    expect(projectSlugSetSpy).toHaveBeenCalledTimes(1);
  });

  it('shows an error dialog when the form is invalid', async () => {
    await service.submitProject();

    expect(projectService.initProject).not.toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(MockErrorDialogComponent, {
      data: {
        message: 'Please fill in the required fields.'
      }
    });
  });

  it('says so when the project could not be created', async () => {
    configurationService.getConfiguration.mockReturnValue(
      of({
        name: 'rootProjectPath',
        value: 'C:/tmp/tag-check-projects'
      })
    );
    // ProjectService answers a failed request with null.
    projectService.initProject.mockReturnValue(of(null));
    service.projectForm.projectName().value.set('Test Project');
    TestBed.flushEffects();
    service.projectForm.measurementId().value.set('G-TEST123');

    await service.submitProject();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(MockErrorDialogComponent, {
      data: {
        message: 'Could not create the project. Please try again.'
      }
    });
  });

  it('submits a valid project and navigates to the project workspace', async () => {
    configurationService.getConfiguration.mockReturnValue(
      of({
        name: 'rootProjectPath',
        value: 'C:/tmp/tag-check-projects'
      })
    );
    projectService.initProject.mockReturnValue(
      of({
        id: 1,
        projectName: 'Test Project',
        projectSlug: 'test-project-abcd'
      })
    );

    service.projectForm.projectName().value.set('Test Project');
    TestBed.flushEffects();
    service.projectForm.measurementId().value.set('G-TEST123');
    service.projectForm.projectDescription().value.set('Demo project');

    await service.submitProject();

    expect(projectService.initProject).toHaveBeenCalledWith({
      measurementId: 'G-TEST123',
      projectDescription: 'Demo project',
      projectName: 'Test Project',
      projectSlug: expect.stringMatching(/^test-project-[a-z0-9]{4}$/)
    });
    expect(router.navigate).toHaveBeenCalledWith([
      '/',
      'projects',
      'test-project-abcd'
    ]);
    expect(service.projectModel()).toEqual({
      measurementId: '',
      projectDescription: '',
      projectName: '',
      projectSlug: ''
    });
  });
});
