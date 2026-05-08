import { describe, it, expect, vi } from 'vitest';
import { EventInspectionControllerService } from './event-inspection-controller.service';
import { SingleEventInspectionService } from '../../features/event-inspection/single-event-inspection.service';
import { GroupEventsInspectionService } from '../../features/event-inspection/group-events-inspection.service';

describe('EventInspectionControllerService', () => {
  function build() {
    const single = {
      inspectSingleEvent: vi.fn().mockResolvedValue('ok'),
      abort: vi.fn()
    } as unknown as SingleEventInspectionService;
    const group = {
      inspectProject: vi.fn().mockResolvedValue('proj'),
      stopOperation: vi.fn()
    } as unknown as GroupEventsInspectionService;
    return {
      svc: new EventInspectionControllerService(single, group),
      single,
      group
    };
  }

  it('forwards inspectSingleEvent with default values when query is empty', async () => {
    const { svc, single } = build();
    const result = await svc.inspectSingleEvent('p', 'e', {} as never);
    expect(result).toBe('ok');
    const call = (single.inspectSingleEvent as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call[0]).toBe('p');
    expect(call[1]).toBe('e');
    expect(call[2].headless).toBe('false');
    expect(call[2].measurementId).toBe('');
    expect(call[2].credentials).toEqual({ username: '', password: '' });
    expect(call[2].captureRequest).toBe('false');
    expect(call[2].eventInspectionPresetDto).toBeDefined();
  });

  it('passes through provided query and preset', async () => {
    const { svc, single } = build();
    const preset = {
      application: { localStorage: { data: [] }, cookie: { data: [] } },
      puppeteerArgs: ['--x']
    } as never;
    await svc.inspectSingleEvent(
      'p',
      'e',
      {
        headless: 'true',
        measurementId: 'M-1',
        username: 'u',
        password: 'pw',
        captureRequest: 'true',
        url: 'https://x'
      } as never,
      preset
    );
    const call = (single.inspectSingleEvent as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call[2].headless).toBe('true');
    expect(call[2].measurementId).toBe('M-1');
    expect(call[2].credentials).toEqual({ username: 'u', password: 'pw' });
    expect(call[2].url).toBe('https://x');
    expect(call[2].eventInspectionPresetDto).toBe(preset);
  });

  it('delegates inspectProject to the group service', async () => {
    const { svc, group } = build();
    const creds = { username: 'a', password: 'b' };
    const result = await svc.inspectProject('p', 'true', 'M', creds, 'true', 4);
    expect(result).toBe('proj');
    expect(group.inspectProject).toHaveBeenCalledWith(
      'p',
      'true',
      'M',
      creds,
      'true',
      4
    );
  });

  it('aborts both services on stopOperation', async () => {
    const { svc, single, group } = build();
    await svc.stopOperation();
    expect(single.abort).toHaveBeenCalled();
    expect(group.stopOperation).toHaveBeenCalled();
  });
});
