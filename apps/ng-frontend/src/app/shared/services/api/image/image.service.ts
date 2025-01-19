import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private imageApiUrl = environment.imageApiUrl;
  private imageSubject = new BehaviorSubject<Blob | null>(null);
  image$ = this.imageSubject.asObservable();

  constructor(private http: HttpClient) {}

  getImage(eventId: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'image/png'
      }),
      responseType: 'blob' as 'json' // This tells angular to parse it as a blob, default is json
    };

    return this.http
      .get<Blob>(`${this.imageApiUrl}/${eventId}`, httpOptions)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }
}
