import { Test } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventsGatewayService } from './events-gateway.service';

describe('EventsGatewayService', () => {
  let service: EventsGatewayService;
  let emit: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [EventsGatewayService]
    }).compile();
    service = module.get(EventsGatewayService);
    emit = vi.fn();
    service.server = { emit } as never;
  });

  it('echoes the message body back through handleEvent', () => {
    expect(service.handleEvent('hello')).toBe('hello');
  });

  it('forwards sendToAll to server.emit with the supplied payload', () => {
    service.sendToAll('topic', { a: 1 });
    expect(emit).toHaveBeenCalledWith('topic', { a: 1 });
  });

  it('emits a progressUpdate frame with totalSteps and currentStep', () => {
    service.sendProgressUpdate(10, 3);
    expect(emit).toHaveBeenCalledWith('progressUpdate', {
      totalSteps: 10,
      currentStep: 3
    });
  });

  it('emits an eventCompleted frame wrapping the message', () => {
    service.sendEventCompleted('done');
    expect(emit).toHaveBeenCalledWith('eventCompleted', { message: 'done' });
  });

  it('lifecycle hooks run without throwing', () => {
    expect(() => service.afterInit()).not.toThrow();
    expect(() => service.handleConnection()).not.toThrow();
    expect(() => service.handleDisconnect()).not.toThrow();
  });
});
