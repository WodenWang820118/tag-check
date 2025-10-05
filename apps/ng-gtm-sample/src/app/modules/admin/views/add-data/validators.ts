import {
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
} from '@angular/forms';
import { Observable, of } from 'rxjs';

export function latitudeValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return of(null); // Don't validate empty values to allow required validator to handle it
    }
    const latitude = parseFloat(value);
    const isValid = !isNaN(latitude) && latitude >= -90 && latitude <= 90;
    return of(isValid ? null : { invalidLatitude: true });
  };
}

export function longitudeValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return of(null); // Don't validate empty values to allow required validator to handle it
    }
    const longitude = parseFloat(value);
    const isValid = !isNaN(longitude) && longitude >= -180 && longitude <= 180;
    return of(isValid ? null : { invalidLongitude: true });
  };
}
