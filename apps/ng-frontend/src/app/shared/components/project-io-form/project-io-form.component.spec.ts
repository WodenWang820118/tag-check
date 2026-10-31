import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';
import { ProjectIoFormComponent } from './project-io-form.component';

describe('ProjectIoFormComponent', () => {
  it('calls exportProject with project slug', async () => {
    const exportProject = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ProjectIoFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { parent: { params: of({ projectSlug: 'demo' }) } }
        },
        { provide: ProjectIoService, useValue: { exportProject } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectIoFormComponent);
    fixture.detectChanges();
    await fixture.componentInstance.exportProject();

    expect(exportProject).toHaveBeenCalledWith('demo');
  });

  it('deletes project and navigates home when confirmed in dialog', async () => {
    const deleteProject = vi.fn().mockReturnValue(of({ success: true }));
    const navigate = vi.fn().mockResolvedValue(true);
    const dialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(true)
      })
    };
    await TestBed.configureTestingModule({
      imports: [ProjectIoFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { parent: { params: of({ projectSlug: 'demo' }) } }
        },
        { provide: ProjectIoService, useValue: { deleteProject } },
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectIoFormComponent);
    fixture.detectChanges();
    await fixture.componentInstance.deleteProject();

    expect(dialog.open).toHaveBeenCalled();
    expect(deleteProject).toHaveBeenCalledWith('demo');
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('does not delete project when dialog is cancelled', async () => {
    const deleteProject = vi.fn();
    const navigate = vi.fn();
    const dialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(false)
      })
    };
    await TestBed.configureTestingModule({
      imports: [ProjectIoFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { parent: { params: of({ projectSlug: 'demo' }) } }
        },
        { provide: ProjectIoService, useValue: { deleteProject } },
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectIoFormComponent);
    fixture.detectChanges();
    await fixture.componentInstance.deleteProject();

    expect(dialog.open).toHaveBeenCalled();
    expect(deleteProject).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
