import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { latitudeValidator, longitudeValidator } from './validators';
import { CountriesDataService } from '../../../../shared/services/countries-data/countries-data.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

type ImageSlot = 'imageBig' | 'image1' | 'image2' | 'image3';

interface MediaFieldConfig {
  key: ImageSlot;
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
  countries: { label: string; value: string }[] = [];
  readonly uploadState = signal<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  readonly uploadMessage = signal('');
  readonly selectedFiles = signal<Record<ImageSlot, string | null>>({
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
      hint: 'Optional third supporting image for richer storytelling.',
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
    price: ['', Validators.required],
    video: [''],
    imageBigAuthorInfo: [''],
    image1AuthorInfo: [''],
    image2AuthorInfo: [''],
    image3AuthorInfo: ['']
  });

  constructor(
    private countriesDataService: CountriesDataService
  ) {
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

  onFileSelected(slot: ImageSlot, event: Event) {
    const input = event.target as HTMLInputElement;
    const fileName = input.files?.[0]?.name ?? null;
    this.selectedFiles.update((currentFiles) => ({
      ...currentFiles,
      [slot]: fileName
    }));
  }

  selectedFileName(slot: ImageSlot) {
    return this.selectedFiles()[slot] ?? 'No file selected yet';
  }

  addDestination() {
    this.destinationForm.markAllAsTouched();
    if (this.destinationForm.invalid) {
      this.uploadState.set('error');
      this.uploadMessage.set(
        'Please complete the highlighted fields before submitting this destination.'
      );
      return;
    }

    this.uploadState.set('success');
    this.uploadMessage.set(
      'Destination draft validated successfully. Firebase persistence and media upload will be wired in the next phase.'
    );
  }
}
