import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WindowSizeService } from './window-size.service';

describe('WindowSizeService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('stays server-safe and returns an empty resize stream on the server path', () => {
    const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener');
    let completed = false;

    TestBed.configureTestingModule({
      providers: [
        WindowSizeService,
        {
          provide: PLATFORM_ID,
          useValue: 'server'
        }
      ]
    });

    const service = TestBed.inject(WindowSizeService);

    service.onResize().subscribe({
      complete: () => {
        completed = true;
      }
    });

    expect(service.width$()).toBe(0);
    expect(completed).toBe(true);
    expect(addEventListenerSpy).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });
});
