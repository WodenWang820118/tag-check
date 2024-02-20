import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'blobToUrl',
  standalone: true,
})
export class BlobToUrlPipe implements PipeTransform {
  transform(value: Blob | null): string | null {
    if (!value) {
      return null;
    }

    return URL.createObjectURL(value);
  }
}
