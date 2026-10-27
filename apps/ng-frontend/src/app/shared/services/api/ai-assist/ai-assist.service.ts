import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { AiAssistResponse, AiAssistSettingsRequest } from '@utils';
import { environment } from '../../../../../environments/environment';

/**
 * AI assist's settings, for every project on this computer, and whether
 * Ollama can serve the chosen model. Each read asks Ollama again.
 */
@Injectable({ providedIn: 'root' })
export class AiAssistService {
  private readonly http = inject(HttpClient);

  get(): Observable<AiAssistResponse> {
    return this.http.get<AiAssistResponse>(environment.aiAssistApiUrl);
  }

  /** Fields left out keep their value; 400 with the reason for an invalid one. */
  update(changes: AiAssistSettingsRequest): Observable<AiAssistResponse> {
    return this.http.put<AiAssistResponse>(environment.aiAssistApiUrl, changes);
  }
}
