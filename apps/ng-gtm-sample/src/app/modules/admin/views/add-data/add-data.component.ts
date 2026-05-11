import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { latitudeValidator, longitudeValidator } from './validators';
import { CountriesDataService } from '../../../../shared/services/countries-data/countries-data.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { FirebaseDestinationUploadService } from '../../../../shared/services/firebase-destination-upload/firebase-destination-upload.service';
import {
  CreateDestinationDraft,
  DestinationImageSlot
} from '../../../../shared/models/create-destination-draft.model';

interface MediaFieldConfig {
  key: DestinationImageSlot;
  label: string;
  hint: string;
  authorControl:
    | 'imageBigAuthorInfo'
    | 'image1AuthorInfo'
    | 'image2AuthorInfo'
    | 'image3AuthorInfo';
}

@Component({
  selector: 'app-add-data',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    MessageModule
  ],
  templateUrl: './add-data.component.html'
})
export class AddDataComponent {
  private readonly fb = inject(FormBuilder);
  private readonly firebaseDestinationUploadService = inject(
    FirebaseDestinationUploadService
  );
  countries: { label: string; value: string }[] = [];
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
  readonly mediaFields: MediaFieldConfig[] = [
    {
      key: 'imageBig',
      label: 'Hero image',
      hint: 'Used on the featured hero and destination header.',
      authorControl: 'imageBigAuthorInfo'
    },
    {
      key: 'image1',
      label: 'Gallery image 1',
      hint: 'Primary supporting image on the product detail page.',
      authorControl: 'image1AuthorInfo'
    },
    {
      key: 'image2',
      label: 'Gallery image 2',
      hint: 'Secondary supporting image for the destination detail gallery.',
      authorControl: 'image2AuthorInfo'
    },
    {
      key: 'image3',
      label: 'Gallery image 3',
      hint: 'Third supporting image for richer storytelling on the detail page.',
      authorControl: 'image3AuthorInfo'
    }
  ];
  destinationForm = this.fb.group({
    country: ['', Validators.required],
    city: ['', Validators.required],
    title: ['', Validators.required],
    smallTitle: ['', Validators.required],
    latitude: ['', [Validators.required, latitudeValidator()]],
    longitude: ['', [Validators.required, longitudeValidator()]],
    description: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(1)]],
    video: [''],
    imageBigAuthorInfo: [''],
    image1AuthorInfo: [''],
    image2AuthorInfo: [''],
    image3AuthorInfo: ['']
  });

  constructor(private readonly countriesDataService: CountriesDataService) {
    this.countriesDataService.getCountries().subscribe((data: any[]) => {
      this.countries = data.map((country) => ({
        label: country.name.common,
        value: country.name.common
      }));
    });
  }

  control(name: keyof typeof this.destinationForm.controls) {
    return this.destinationForm.controls[name];
  }

  hasError(
    name: keyof typeof this.destinationForm.controls,
    error?: string
  ): boolean {
    const control = this.control(name);
    if (!control) {
      return false;
    }

    if (!error) {
      return control.invalid && control.touched;
    }

    return control.hasError(error) && control.touched;
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
    return this.mediaFields.some(
      (mediaField) => !this.selectedFiles()[mediaField.key]
    );
  }

  private buildDraft(): CreateDestinationDraft | null {
    const files = this.selectedFiles();

    if (!files.imageBig || !files.image1 || !files.image2 || !files.image3) {
      return null;
    }

    const rawValue = this.destinationForm.getRawValue();

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
    this.destinationForm.markAllAsTouched();
    if (this.destinationForm.invalid || this.hasMissingFiles()) {
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
        this.destinationForm.reset();
        this.selectedFiles.set({
          imageBig: null,
          image1: null,
          image2: null,
          image3: null
        });
      },
      error: (error) => {
        console.error('destination upload error', error);
        this.uploadState.set('error');
        this.uploadMessage.set(
          'The destination could not be created. Please check your Firebase permissions and try again.'
        );
      }
    });
  }
}
