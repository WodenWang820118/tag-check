import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UploadSpecService {
  isStarted = signal<boolean>(false);
  isUploaded = signal<boolean>(false);
  isOpenImportSidenav = signal<boolean>(false);

  // empty constructor removed
  existKeys(parsedSpec: any[]): boolean {
    for (const spec of parsedSpec) {
      if (!Object.prototype.hasOwnProperty.call(spec, 'event')) {
        return false;
      }
    }
    return true;
  }

  completeUpload() {
    this.isUploaded.set(true);
    this.resetStart();
  }

  openImportSidenav() {
    this.isOpenImportSidenav.set(true);
  }

  startUpload() {
    this.isStarted.set(true);
  }

  resetStart() {
    this.isStarted.set(false);
  }

  resetImport() {
    this.isOpenImportSidenav.set(false);
  }
}
