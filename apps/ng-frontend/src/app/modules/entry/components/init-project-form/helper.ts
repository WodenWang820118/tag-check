import {
  FormControl,
  FormGroupDirective,
  NgForm,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class InstantErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    // Check if the control is invalid and either touched or the parent form is submitted
    return !!(
      control &&
      control.invalid &&
      (control.touched || (form && form.submitted))
    );
  }

  allowedCharactersValidator(allowedPattern: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isValid = allowedPattern.test(control.value);
      return isValid ? null : { invalidCharacters: true };
    };
  }
}
