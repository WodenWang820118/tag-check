import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { FieldTree, form, validate } from '@angular/forms/signals';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InitProjectFormComponent } from './init-project-form.component';
import {
  InitProjectFormFacadeService,
  ProjectFormModel
} from './init-project-form-facade.service';

describe('InitProjectFormComponent', () => {
  const model = signal<ProjectFormModel>({
    projectName: '',
    projectSlug: '',
    measurementId: '',
    projectDescription: ''
  });
  let projectForm: FieldTree<ProjectFormModel>;
  const facade = {
    observeProjectNameChanges: vi.fn(),
    // form() needs an injection context: created in beforeEach.
    get projectForm(): FieldTree<ProjectFormModel> {
      return projectForm;
    },
    submitProject: vi.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    model.set({
      projectName: '',
      projectSlug: '',
      measurementId: '',
      projectDescription: ''
    });
    facade.observeProjectNameChanges.mockReset();
    facade.submitProject.mockClear();

    await TestBed.configureTestingModule({
      imports: [InitProjectFormComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: InitProjectFormFacadeService,
          useValue: facade
        }
      ]
    }).compileComponents();
    projectForm = TestBed.runInInjectionContext(() => form(model));
  });

  it('does not register another project-name observer during initialization', () => {
    const fixture = TestBed.createComponent(InitProjectFormComponent);

    fixture.detectChanges();

    expect(facade.observeProjectNameChanges).not.toHaveBeenCalled();
  });

  it('delegates submit actions to the facade', async () => {
    const fixture = TestBed.createComponent(InitProjectFormComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    await component.onSubmit();

    expect(facade.submitProject).toHaveBeenCalled();
  });

  it('shows the invalid characters message once the name is touched', async () => {
    projectForm = TestBed.runInInjectionContext(() =>
      form(model, (p) => {
        validate(p.projectName, ({ value }) =>
          value().includes('@') ? { kind: 'invalidCharacters' } : undefined
        );
      })
    );
    const fixture = TestBed.createComponent(InitProjectFormComponent);
    fixture.detectChanges();

    projectForm.projectName().value.set('Bad@Name');
    projectForm.projectName().markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    const error: HTMLElement | null =
      fixture.nativeElement.querySelector('mat-error');
    expect(error?.textContent).toContain('Can only have:');
  });
});
