import { Injectable } from '@angular/core';
import { MetadataSourceService } from '../metadata-source/metadata-source.service';
import { map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MetadataSourceFacadeService {
  constructor(private metadataSourceService: MetadataSourceService) {}

  observeTableFilter() {
    return this.metadataSourceService.getFilterStream().pipe(
      map((filter) => {
        return filter;
      }),
      catchError((error) => {
        console.error(error);
        return of('');
      })
    );
  }
}
