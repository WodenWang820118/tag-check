import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CountriesDataService } from '../../../../shared/services/countries-data/countries-data.service';
import { FirebaseDestinationUploadService } from '../../../../shared/services/firebase-destination-upload/firebase-destination-upload.service';
import { AddDataComponent } from './add-data.component';

function createFiles() {
  return {
    imageBig: new File(['hero'], 'hero.jpg', { type: 'image/jpeg' }),
    image1: new File(['one'], 'one.png', { type: 'image/png' }),
    image2: new File(['two'], 'two.webp', { type: 'image/webp' }),
    image3: new File(['three'], 'three.jpg', { type: 'image/jpeg' })
  };
}

describe('AddDataComponent', () => {
  const countriesDataService = {
    getCountries: vi.fn(() =>
      of([
        {
          name: {
            common: 'Japan'
          }
        }
      ])
    )
  };
  const uploadService = {
    upload: vi.fn(() =>
      of({
        id: 'destination-1'
      })
    )
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    countriesDataService.getCountries.mockClear();
    uploadService.upload.mockReset();
    uploadService.upload.mockReturnValue(
      of({
        id: 'destination-1'
      })
    );

    await TestBed.configureTestingModule({
      imports: [AddDataComponent],
      providers: [
        {
          provide: CountriesDataService,
          useValue: countriesDataService
        },
        {
          provide: FirebaseDestinationUploadService,
          useValue: uploadService
        }
      ]
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AddDataComponent);
    fixture.detectChanges();
    return fixture;
  }

  function fillValidForm(component: AddDataComponent) {
    component.destinationForm.setValue({
      country: 'Japan',
      city: 'Tokyo',
      title: 'Tokyo Lights',
      smallTitle: 'Japan',
      latitude: '35.68',
      longitude: '139.76',
      description: 'A city break destination.',
      price: '1299',
      video: 'https://youtu.be/demo',
      imageBigAuthorInfo: 'Hero credit',
      image1AuthorInfo: 'Image 1 credit',
      image2AuthorInfo: 'Image 2 credit',
      image3AuthorInfo: 'Image 3 credit'
    });
  }

  it('shows an error and does not upload when the form is incomplete', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.addDestination();

    expect(component.uploadState()).toBe('error');
    expect(component.uploadMessage()).toContain('Please complete');
    expect(uploadService.upload).not.toHaveBeenCalled();
  });

  it('blocks submission when a valid form is missing one of the required image files', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const files = createFiles();

    fillValidForm(component);
    component.selectedFiles.set({
      ...files,
      image2: null
    });

    component.addDestination();

    expect(component.uploadState()).toBe('error');
    expect(component.uploadMessage()).toContain('attach all four destination images');
    expect(uploadService.upload).not.toHaveBeenCalled();
  });

  it('builds a typed draft, uploads it, and resets the form after success', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const files = createFiles();

    fillValidForm(component);
    component.selectedFiles.set(files);

    component.addDestination();

    expect(uploadService.upload).toHaveBeenCalledTimes(1);
    const draft = uploadService.upload.mock.calls[0][0];
    expect(draft).toEqual({
      country: 'Japan',
      city: 'Tokyo',
      title: 'Tokyo Lights',
      smallTitle: 'Japan',
      latitude: 35.68,
      longitude: 139.76,
      description: 'A city break destination.',
      price: 1299,
      video: 'https://youtu.be/demo',
      imageBigAuthorInfo: 'Hero credit',
      image1AuthorInfo: 'Image 1 credit',
      image2AuthorInfo: 'Image 2 credit',
      image3AuthorInfo: 'Image 3 credit',
      files
    });
    expect(component.uploadState()).toBe('success');
    expect(component.uploadMessage()).toContain('Destination created successfully');
    expect(component.destinationForm.getRawValue().country).toBeNull();
    expect(component.destinationForm.getRawValue().price).toBeNull();
    expect(component.selectedFiles()).toEqual({
      imageBig: null,
      image1: null,
      image2: null,
      image3: null
    });
  });

  it('shows a Firebase-specific error message when the upload fails', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const files = createFiles();
    uploadService.upload.mockReturnValueOnce(
      throwError(() => new Error('permission denied'))
    );

    fillValidForm(component);
    component.selectedFiles.set(files);
    component.addDestination();

    expect(component.uploadState()).toBe('error');
    expect(component.uploadMessage()).toContain('could not be created');
  });
});
