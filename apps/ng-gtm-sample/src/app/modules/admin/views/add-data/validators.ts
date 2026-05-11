import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function latitudeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const latitude = Number.parseFloat(value);
    const isValid =
      !Number.isNaN(latitude) && latitude >= -90 && latitude <= 90;
    return isValid ? null : { invalidLatitude: true };
  };
}

export function longitudeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const longitude = Number.parseFloat(value);
    const isValid =
      !Number.isNaN(longitude) && longitude >= -180 && longitude <= 180;
    return isValid ? null : { invalidLongitude: true };
  };
}
