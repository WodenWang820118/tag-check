import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TagBuildMode, TagBuildModeService } from './tag-build-mode.service';

describe('TagBuildModeService', () => {
  let service: TagBuildModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TagBuildModeService);
  });

  it('defaults to TagBuild mode', () => {
    expect(service.mode).toBe(TagBuildMode.TagBuild);
    expect(service.mode).toBe(0);
  });

  it('updates the mode through setMode', () => {
    service.setMode(TagBuildMode.TagExtract);
    expect(service.mode).toBe(TagBuildMode.TagExtract);
    expect(service.mode).toBe(1);
  });

  it('exposes a writable signal that reflects updates', () => {
    const signal = service.modeSignal;
    expect(signal()).toBe(TagBuildMode.TagBuild);

    signal.set(TagBuildMode.TagExtract);
    expect(service.mode).toBe(TagBuildMode.TagExtract);
  });
});
