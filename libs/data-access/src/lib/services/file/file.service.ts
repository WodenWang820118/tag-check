import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  /**
   * Read a File as an ArrayBuffer and return it as an Observable.
   * This mirrors usage like `from(file.text())` across the codebase.
   */
  loadFile(file: File): Observable<ArrayBuffer> {
    // File.arrayBuffer() returns a Promise<ArrayBuffer> — convert to Observable
    return from(file.arrayBuffer());
  }
}
