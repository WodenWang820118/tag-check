import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, required, schema, validate } from '@angular/forms/signals';
import { isValidLatitude, isValidLongitude } from './validators';
import { CountriesDataService } from '../../../../shared/services/countries-data/countries-data.service';
import { FirebaseDestinationUploadService } from '../../../../shared/services/firebase-destination-upload/firebase-destination-upload.service';
import {
  CreateDestinationDraft,
  DestinationImageSlot
} from '../../../../shared/models/create-destination-draft.model';

export interface DestinationFormModel {
  country: string;
  city: string;
  title: string;
  smallTitle: string;
  latitude: string;
  longitude: string;
  description: string;
  price: string;
  video: string;
  imageBigAuthorInfo: string;
  image1AuthorInfo: string;
  image2AuthorInfo: string;
  image3AuthorInfo: string;
}

export const initialDestinationFormValues: DestinationFormModel = {
  country: '',
  city: '',
  title: '',
  smallTitle: '',
  latitude: '',
  longitude: '',
  description: '',
  price: '',
  video: '',
  imageBigAuthorInfo: '',
  image1AuthorInfo: '',
  image2AuthorInfo: '',
  image3AuthorInfo: ''
};

export const destinationSchema = schema<DestinationFormModel>((p) => {
  required(p.country);
  required(p.city);
  required(p.title);
  required(p.smallTitle);
  required(p.latitude);
  validate(p.latitude, ({ value }) => {
    return isValidLatitude(value()) ? null : { kind: 'invalidLatitude' };
  });
  required(p.longitude);
  validate(p.longitude, ({ value }) => {
    return isValidLongitude(value()) ? null : { kind: 'invalidLongitude' };
  });
  required(p.description);
  required(p.price);
  validate(p.price, ({ value }) => {
    const val = value();
    if (val === null || val === undefined || val === '') {
      return null;
    }
    const price = Number.parseFloat(val);
    const isValid = !Number.isNaN(price) && price >= 1;
    return isValid ? null : { kind: 'min' };
  });
});

@Injectable()
export class AddDataFacadeService {
  private readonly firebaseDestinationUploadService = inject(
    FirebaseDestinationUploadService
  );
  private readonly countriesDataService = inject(CountriesDataService);

  private readonly countriesSignal = toSignal(
    this.countriesDataService.getCountries(),
    { initialValue: [] }
  );

  /** Loaded country options for the destination country selector. */
  readonly countries = computed<{ label: string; value: string }[]>(() =>
    this.countriesSignal().map((country) => ({
      label: country.name.common,
      value: country.name.common
    }))
  );

  readonly uploadState = signal<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  readonly uploadMessage = signal('');
  readonly selectedFiles = signal<Record<DestinationImageSlot, File | null>>({
    imageBig: null,
    image1: null,
    image2: null,
    image3: null
  });

  readonly destinationModel = signal<DestinationFormModel>({
    ...initialDestinationFormValues
  });

  readonly destinationForm = form(this.destinationModel, destinationSchema);

  control<K extends keyof DestinationFormModel>(name: K) {
    return this.destinationForm[name];
  }

  hasError(
    name: keyof DestinationFormModel,
    error?: string
  ): boolean {
    const field = this.control(name);
    if (!field) return false;
    const state = field();
    if (!error) return state.invalid() && state.touched();
    return state.getError(error) !== undefined && state.touched();
  }

  onFileSelected(slot: DestinationImageSlot, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFiles.update((currentFiles) => ({
      ...currentFiles,
      [slot]: file
    }));
  }

  selectedFileName(slot: DestinationImageSlot) {
    return this.selectedFiles()[slot]?.name ?? 'No file selected yet';
  }

  hasMissingFiles() {
    return Object.values(this.selectedFiles()).some((file) => !file);
  }

  private buildDraft(): CreateDestinationDraft | null {
    const files = this.selectedFiles();
    if (!files.imageBig || !files.image1 || !files.image2 || !files.image3) {
      return null;
    }

    const rawValue = this.destinationForm().value();
    return {
      country: rawValue.country ?? '',
      city: rawValue.city ?? '',
      title: rawValue.title ?? '',
      smallTitle: rawValue.smallTitle ?? '',
      latitude: Number(rawValue.latitude),
      longitude: Number(rawValue.longitude),
      description: rawValue.description ?? '',
      price: Number(rawValue.price),
      video: rawValue.video ?? '',
      imageBigAuthorInfo: rawValue.imageBigAuthorInfo ?? '',
      image1AuthorInfo: rawValue.image1AuthorInfo ?? '',
      image2AuthorInfo: rawValue.image2AuthorInfo ?? '',
      image3AuthorInfo: rawValue.image3AuthorInfo ?? '',
      files: {
        imageBig: files.imageBig,
        image1: files.image1,
        image2: files.image2,
        image3: files.image3
      }
    };
  }

  addDestination() {
    this.destinationForm().markAsTouched();
    if (this.destinationForm().invalid() || this.hasMissingFiles()) {
      this.uploadState.set('error');
      this.uploadMessage.set(
        'Please complete the highlighted fields and attach all four destination images before submitting.'
      );
      return;
    }

    const draft = this.buildDraft();
    if (!draft) {
      this.uploadState.set('error');
      this.uploadMessage.set(
        'A required image is missing. Please attach the full media set before submitting.'
      );
      return;
    }

    this.uploadState.set('saving');
    this.uploadMessage.set(
      'Uploading destination assets and saving the Firestore document...'
    );

    this.firebaseDestinationUploadService.upload(draft).subscribe({
      next: () => {
        this.uploadState.set('success');
        this.uploadMessage.set(
          'Destination created successfully. The admin cache has been refreshed for the new entry.'
        );
        this.destinationForm().reset(initialDestinationFormValues);
        this.destinationModel.set({ ...initialDestinationFormValues });
        this.selectedFiles.set({
          imageBig: null,
          image1: null,
          image2: null,
          image3: null
        });
      },
      error: (error: unknown) => {
        console.error('destination upload error', error);
        this.uploadState.set('error');
        this.uploadMessage.set(
          'The destination could not be created. Please check your Firebase permissions and try again.'
        );
      }
    });
  }
}
