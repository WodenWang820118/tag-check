import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private imageApiUrl = environment.imageApiUrl;
  private imageSubject = new BehaviorSubject<Blob | null>(null);
  image$ = this.imageSubject.asObservable();

  constructor(private http: HttpClient) {}

  getImage(projectSlug: string, eventName: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'image/png',
      }),
      responseType: 'blob' as 'json', // This tells angular to parse it as a blob, default is json
    };

    return this.http
      .get<Blob>(`${this.imageApiUrl}/${projectSlug}/${eventName}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 500) {
      // Handle 500 Internal Server Error specifically
      // Here, you can decide how to handle the error and what message to display
      return throwError(() => 'internal server error occurred');
    } else if (error.status === 404) {
      // Handle 404 Not Found specifically
      // Here, you can decide how to handle the error and what message to display
      return throwError(() => 'requested resource was not found');
    } else {
      // Return an observable with a user-facing error message
      return throwError(() => 'unknown error occurred');
    }
  }
}
