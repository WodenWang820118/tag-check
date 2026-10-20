import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'blobToUrl',
  standalone: true
})
export class BlobToUrlPipe implements PipeTransform {
  // Returns a plain string: Angular does not sanitize img/source src, so a
  // SafeUrl would be set as the text "SafeValue must use...".
  transform(blob: Blob | null): string {
    if (!blob) {
      return '';
    }
    return URL.createObjectURL(blob);
  }
}
