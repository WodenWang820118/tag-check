import { TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../../environments/environment';
import { ProjectImportComponent } from './project-import.component';

describe('ProjectImportComponent', () => {
  const navigate = vi.fn(() => Promise.resolve(true));
  const openSnackBar = vi.fn();
  let http: HttpTestingController;
  let component: ProjectImportComponent;

  beforeEach(() => {
    navigate.mockClear();
    openSnackBar.mockClear();
    TestBed.configureTestingModule({
      imports: [ProjectImportComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
        { provide: MatSnackBar, useValue: { open: openSnackBar } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(
      ProjectImportComponent
    ).componentInstance;
  });

  afterEach(() => http.verify());

  function chooseFile() {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['zip'], 'demo.zip')]
    });
    component.importProject({ target: input } as unknown as Event);
    return http.expectOne(`${environment.projectApiUrl}/import`);
  }

  it('opens the projects list once, after the import response', () => {
    const request = chooseFile();

    // The upload finishes before the server has imported anything.
    request.event({ type: HttpEventType.UploadProgress, loaded: 5, total: 5 });
    request.event({ type: HttpEventType.UploadProgress, loaded: 5, total: 5 });
    expect(component.uploadProgress()).toBe(100);
    expect(navigate).not.toHaveBeenCalled();

    // POST /projects/import answers with the imported project's slug.
    request.flush(JSON.parse(JSON.stringify({ projectSlug: 'demo' })));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['./']);
    expect(component.uploading()).toBe(false);
    expect(openSnackBar).not.toHaveBeenCalled();
  });

  it('says the import failed and stays on the page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const request = chooseFile();

    request.event({ type: HttpEventType.UploadProgress, loaded: 5, total: 5 });
    request.flush(
      { statusCode: 400, message: 'Only zip files are allowed!' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(navigate).not.toHaveBeenCalled();
    expect(component.uploading()).toBe(false);
    expect(openSnackBar).toHaveBeenCalledWith(
      expect.stringContaining('Could not import the project'),
      'Dismiss',
      { duration: 5000 }
    );
  });
});
