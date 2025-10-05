import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { latitudeValidator, longitudeValidator } from './validators';
import { FirebaseDestinationUploadService } from '../../../../shared/services/firebase-destination-upload/firebase-destination-upload.service';
import { CountriesDataService } from '../../../../shared/services/countries-data/countries-data.service';

@Component({
  selector: 'app-add-data',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './add-data.component.html',
  styles: [``]
})
export class AddDataComponent {
  private readonly fb = inject(FormBuilder);
  countries!: any[];
  destinationForm = this.fb.group({
    country: ['', Validators.required],
    city: ['', Validators.required],
    latitude: ['', Validators.required, latitudeValidator()],
    longitude: ['', Validators.required, longitudeValidator()],
    description: ['']
  });
  constructor(
    private countriesDataService: CountriesDataService,
    private firebaseDestinationUploadService: FirebaseDestinationUploadService
  ) {
    this.countriesDataService.getCountries().subscribe((data: any[]) => {
      this.countries = data;
    });
  }

  addDestination() {
    // TODO: Implement this method
    if (this.destinationForm.invalid) {
      console.log('Invalid form');
      console.log(this.destinationForm.value);
      console.log(this.destinationForm.errors);
      return;
    } else {
      console.log(this.destinationForm.value);
      this.firebaseDestinationUploadService
        .upload(this.destinationForm.value)
        .subscribe();
    }
  }
}
