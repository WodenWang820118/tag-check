import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InitProjectFormComponent } from './init-project-form.component';
import { InitProjectFormFacadeService } from './init-project-form-facade.service';
import { InstantErrorStateMatcher } from './helper';

describe('InitProjectFormComponent', () => {
  const formBuilder = new FormBuilder();
  const facade = {
    observeProjectNameChanges: vi.fn(),
    projectForm: formBuilder.nonNullable.group({
      projectName: [''],
      projectSlug: [''],
      measurementId: [''],
      projectDescription: ['']
    }),
    submitProject: vi.fn(() => EMPTY),
    validProjectNameMatcher: new InstantErrorStateMatcher()
  };

  beforeEach(async () => {
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
  });

  it('does not register another project-name observer during initialization', () => {
    const fixture = TestBed.createComponent(InitProjectFormComponent);

    fixture.detectChanges();

    expect(facade.observeProjectNameChanges).not.toHaveBeenCalled();
  });

  it('delegates submit actions to the facade', () => {
    const fixture = TestBed.createComponent(InitProjectFormComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.onSubmit();

    expect(facade.submitProject).toHaveBeenCalled();
  });
});
