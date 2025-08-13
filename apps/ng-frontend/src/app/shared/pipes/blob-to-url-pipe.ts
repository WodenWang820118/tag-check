import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'blobToUrl',
  standalone: true
})
export class BlobToUrlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(blob: Blob | null): SafeUrl | '' {
    if (!blob) {
      return '';
    }
    const objectUrl = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
  }
}
