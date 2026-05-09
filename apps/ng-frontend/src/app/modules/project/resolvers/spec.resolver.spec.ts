import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import {
  reportDetailEventIdResolver,
  reportDetailSlugResolver,
  specResolver
} from './spec.resolver';

describe('spec.resolver', () => {
  const specService = { getEventSpec: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    specService.getEventSpec = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: SpecService, useValue: specService }]
    });
  });

  function run<T>(fn: () => T) {
    return TestBed.runInInjectionContext(fn);
  }

  it('specResolver fetches spec using parent slug and event id', () => {
    const obs = of({} as any);
    specService.getEventSpec.mockReturnValue(obs);

    const route = {
      parent: { params: { projectSlug: 'p' } } as any,
      params: { eventId: 'e' }
    } as unknown as ActivatedRouteSnapshot;
    const result = run(() => specResolver(route, {} as RouterStateSnapshot));

    expect(result).toBe(obs);
    expect(specService.getEventSpec).toHaveBeenCalledWith('p', 'e');
  });

  it('reportDetailSlugResolver returns the parent project slug', () => {
    const route = {
      parent: { params: { projectSlug: 'pp' } } as any,
      params: {}
    } as unknown as ActivatedRouteSnapshot;
    expect(
      run(() => reportDetailSlugResolver(route, {} as RouterStateSnapshot))
    ).toBe('pp');
  });

  it('reportDetailEventIdResolver returns the route event id', () => {
    const route = {
      params: { eventId: 'ev1' }
    } as unknown as ActivatedRouteSnapshot;
    expect(
      run(() => reportDetailEventIdResolver(route, {} as RouterStateSnapshot))
    ).toBe('ev1');
  });
});
