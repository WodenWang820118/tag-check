import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WebSocketService } from '../web-socket/web-socket.service';
import { ProgressUpdateService } from './progress-update.service';

describe('ProgressUpdateService', () => {
  let connectionStatus: ReturnType<typeof signal<boolean>>;
  let socket: { on: ReturnType<typeof vi.fn> };
  let webSocketService: Partial<WebSocketService>;

  beforeEach(() => {
    connectionStatus = signal(false);
    socket = { on: vi.fn() };
    webSocketService = {
      connectionStatus$: connectionStatus,
      getSocket: () => socket as never
    };
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        ProgressUpdateService,
        { provide: WebSocketService, useValue: webSocketService }
      ]
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('exposes signal-backed defaults of 0/0/false', () => {
    const service = TestBed.inject(ProgressUpdateService);
    expect(service.currentStep$()).toBe(0);
    expect(service.totalSteps$()).toBe(0);
    expect(service.eventCompleted$()).toBe(false);
  });

  it('round-trips current/total/eventCompleted setters', () => {
    const service = TestBed.inject(ProgressUpdateService);
    service.setCurrentStep(3);
    service.setTotalSteps(10);
    service.setEventCompleted(true);
    expect(service.currentStep$()).toBe(3);
    expect(service.totalSteps$()).toBe(10);
    expect(service.eventCompleted$()).toBe(true);
  });

  it('subscribes to progress events once the socket is connected', () => {
    TestBed.inject(ProgressUpdateService);
    TestBed.tick();
    expect(socket.on).not.toHaveBeenCalled();
    connectionStatus.set(true);
    TestBed.tick();
    expect(socket.on).toHaveBeenCalledWith(
      'progressUpdate',
      expect.any(Function)
    );
    expect(socket.on).toHaveBeenCalledWith(
      'eventCompleted',
      expect.any(Function)
    );
  });

  it('progressUpdate handler updates current and total steps', () => {
    const service = TestBed.inject(ProgressUpdateService);
    connectionStatus.set(true);
    TestBed.tick();
    const handler = socket.on.mock.calls.find(
      ([event]) => event === 'progressUpdate'
    )?.[1] as (data: { currentStep: number; totalSteps: number }) => void;
    handler({ currentStep: 4, totalSteps: 7 });
    expect(service.currentStep$()).toBe(4);
    expect(service.totalSteps$()).toBe(7);
  });

  it('eventCompleted handler flips the flag and resets counters', () => {
    const service = TestBed.inject(ProgressUpdateService);
    service.setCurrentStep(5);
    service.setTotalSteps(9);
    connectionStatus.set(true);
    TestBed.tick();
    const handler = socket.on.mock.calls.find(
      ([event]) => event === 'eventCompleted'
    )?.[1] as (data: unknown) => void;
    handler({});
    expect(service.eventCompleted$()).toBe(true);
    expect(service.currentStep$()).toBe(0);
    expect(service.totalSteps$()).toBe(0);
  });
});
