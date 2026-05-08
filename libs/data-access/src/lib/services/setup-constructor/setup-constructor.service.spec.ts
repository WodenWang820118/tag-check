import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SetupConstructorService } from './setup-constructor.service';

describe('SetupConstructorService', () => {
  let service: SetupConstructorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetupConstructorService);
  });

  it('exposes sensible defaults', () => {
    expect(service.googleTagName$()).toBe('Google Tag');
    expect(service.measurementId$()).toBe('G-XXXXXXXXXX');
    expect(service.includeItemScopedVariables$()).toBe(false);
    expect(service.isSendingEcommerceData$()).toBe(false);
  });

  it('updates each signal independently through its setter', () => {
    service.setGoogleTagName('My Tag');
    service.setMeasurementId('G-ABC123');
    service.setIncludeItemScopedVariables(true);
    service.setIsSendingEcommerceData(true);

    expect(service.googleTagName$()).toBe('My Tag');
    expect(service.measurementId$()).toBe('G-ABC123');
    expect(service.includeItemScopedVariables$()).toBe(true);
    expect(service.isSendingEcommerceData$()).toBe(true);
  });
});
