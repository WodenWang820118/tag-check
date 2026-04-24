import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import { InitProjectFormFacadeService } from './init-project-form-facade.service';

@Component({
  standalone: true,
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

    service.projectForm.controls.projectName.setValue('Corporate Website');

    expect(service.projectForm.controls.projectSlug.value).toMatch(
      /^corporate-website-[a-z0-9]{4}$/
    );
  });

  it('normalizes whitespace and invalid symbols when generating a slug', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    service.projectForm.controls.projectName.setValue('  Test  Project!!  ');

    expect(service.projectForm.controls.projectSlug.value).toMatch(
      /^test-project-[a-z0-9]{4}$/
    );
  });

  it('guards against duplicate project-name subscriptions', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    const projectSlugSetValueSpy = vi.spyOn(
      service.projectForm.controls.projectSlug,
      'setValue'
    );

    service.observeProjectNameChanges();
    service.projectForm.controls.projectName.setValue('Single Observer');

    expect(projectSlugSetValueSpy).toHaveBeenCalledTimes(1);
  });

  it('shows an error dialog when the form is invalid', async () => {
    service.submitProject();
    await Promise.resolve();

    expect(projectService.initProject).not.toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(MockErrorDialogComponent, {
      data: {
        message: 'Please fill in the required fields.'
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

    service.projectForm.controls.projectName.setValue('Test Project');
    service.projectForm.controls.measurementId.setValue('G-TEST123');
    service.projectForm.controls.projectDescription.setValue('Demo project');

    await firstValueFrom(service.submitProject());
    await Promise.resolve();

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
    expect(service.projectForm.getRawValue()).toEqual({
      measurementId: '',
      projectDescription: '',
      projectName: '',
      projectSlug: ''
    });
  });
});
