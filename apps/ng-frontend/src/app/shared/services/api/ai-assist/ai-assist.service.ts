import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  AiAssistResponse,
  AiAssistSettingsRequest,
  SelectorSuggestionsResponse,
  SelectorTrialRequest,
  SelectorTrialResponse,
  StepFailureContext
} from '@utils';
import { environment } from '../../../../../environments/environment';

/**
 * AI assist: its settings, for every project on this computer, whether
 * Ollama can serve the chosen model (each read asks Ollama again), what a
 * run's failed step saw, the model's suggestions and trial runs.
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

  /** What run `runId`'s failed step saw; 404 when the run kept none. */
  getStepFailure(
    projectSlug: string,
    eventId: string,
    runId: number
  ): Observable<StepFailureContext> {
    return this.http.get<StepFailureContext>(
      `${environment.aiAssistApiUrl}/step-failures/${projectSlug}/${eventId}`,
      { params: { run: runId } }
    );
  }

  /**
   * The model's suggestions for run `runId`'s failed step. 409 while AI
   * assist is off, 503 without Ollama or the model, 502 for an unusable
   * answer.
   */
  suggest(
    projectSlug: string,
    eventId: string,
    runId: number
  ): Observable<SelectorSuggestionsResponse> {
    return this.http.post<SelectorSuggestionsResponse>(
      `${environment.aiAssistApiUrl}/suggestions/${projectSlug}/${eventId}`,
      null,
      { params: { run: runId } }
    );
  }

  /**
   * Runs the test with other selectors for one step, and emits the saved
   * run once it has run. The recording does not change.
   */
  trial(
    projectSlug: string,
    eventId: string,
    request: SelectorTrialRequest
  ): Observable<SelectorTrialResponse> {
    return this.http.post<SelectorTrialResponse>(
      `${environment.aiAssistApiUrl}/trials/${projectSlug}/${eventId}`,
      request
    );
  }
}
