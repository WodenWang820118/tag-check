import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AiAssistResponse } from '@utils';
import { environment } from '../../../../../environments/environment';
import { AiAssistService } from './ai-assist.service';

const state: AiAssistResponse = JSON.parse(
  JSON.stringify({
    settings: {
      enabled: true,
      ollamaUrl: 'http://127.0.0.1:11434',
      model: 'qwen3.5:9b'
    },
    readiness: { kind: 'ready', version: '0.40.8', models: ['qwen3.5:9b'] }
  })
) as AiAssistResponse;

describe('AiAssistService', () => {
  let service: AiAssistService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AiAssistService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the state', async () => {
    const read = firstValueFrom(service.get());
    const request = http.expectOne(environment.aiAssistApiUrl);
    expect(request.request.method).toBe('GET');
    request.flush(state);

    await expect(read).resolves.toEqual(state);
  });

  it('sends only the changed settings', async () => {
    const updated = firstValueFrom(service.update({ enabled: true }));
    const request = http.expectOne(environment.aiAssistApiUrl);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ enabled: true });
    request.flush(state);

    await expect(updated).resolves.toEqual(state);
  });
});
