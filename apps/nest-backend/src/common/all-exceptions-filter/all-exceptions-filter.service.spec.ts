import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpException,
  Logger,
  NotFoundException,
  ArgumentsHost
} from '@nestjs/common';

const addDocMock = vi.fn().mockResolvedValue(undefined);
const collectionMock = vi.fn(() => ({ __collection: true }));

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args)
}));

import { AllExceptionsFilter } from './all-exceptions-filter.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

function buildHost(req: {
  url: string;
  method: string;
  id?: string;
  headers?: Record<string, string>;
  body?: unknown;
  diagnosticContext?: {
    operation?: string;
    projectSlug?: string;
  };
}) {
  const send = vi.fn().mockReturnThis();
  const header = vi.fn().mockReturnThis();
  const code = vi.fn().mockReturnValue({ send });
  const response = { code, send, header };
  const request = {
    headers: {},
    ...req
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request
    })
  } as unknown as ArgumentsHost;
  return { host, code, send, header };
}

describe('AllExceptionsFilter', () => {
  let firebase: FirebaseService;
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    addDocMock.mockClear();
    collectionMock.mockClear();
    firebase = {
      getFirestore: vi.fn(() => ({ __db: true })),
      getErrorCollectionName: vi.fn(() => 'errors')
    } as unknown as FirebaseService;
    filter = new AllExceptionsFilter(firebase);
  });

  it('responds with the HttpException status and message body', async () => {
    const { host, code, send, header } = buildHost({
      url: '/x',
      method: 'GET',
      id: 'req-1'
    });
    await filter.catch(new NotFoundException('missing'), host);

    expect(code).toHaveBeenCalledWith(404);
    expect(header).toHaveBeenCalledWith('x-request-id', 'req-1');
    const body = send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(404);
    expect(body.path).toBe('/x');
    expect(body.requestId).toBe('req-1');
    expect(body.message).toBeDefined();
  });

  it('uses 500 + Internal Server Error for unknown exceptions and logs locally', async () => {
    const errSpy = vi
      .spyOn(Logger, 'error')
      .mockImplementation(() => undefined);
    const { host, code, send } = buildHost({ url: '/y', method: 'POST' });
    await filter.catch(new Error('boom'), host);

    expect(code).toHaveBeenCalledWith(500);
    const body = send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.message).toBe('Internal Server Error');
    expect(errSpy).toHaveBeenCalledWith(
      'Unhandled Exception: boom',
      expect.any(String),
      'AllExceptionsFilter'
    );
    errSpy.mockRestore();
  });

  it('logs errors to firestore via the FirebaseService collection', async () => {
    const { host } = buildHost({
      url: '/z?token=secret',
      method: 'PUT',
      headers: {
        authorization: 'Bearer secret',
        cookie: 'sid=secret',
        'x-request-id': '11111111-1111-4111-8111-111111111111'
      },
      body: { report: 'raw report payload' },
      diagnosticContext: {
        operation: 'reports.list',
        projectSlug: 'proj-1'
      }
    });
    await filter.catch(new HttpException('oops', 400), host);
    await Promise.resolve();

    expect(firebase.getFirestore).toHaveBeenCalled();
    expect(firebase.getErrorCollectionName).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith({ __db: true }, 'errors');
    expect(addDocMock).toHaveBeenCalledTimes(1);
    const doc = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(doc.path).toBe('/z');
    expect(doc.method).toBe('PUT');
    expect(doc.statusCode).toBe(400);
    expect(doc.requestId).toBe('11111111-1111-4111-8111-111111111111');
    expect(doc.operation).toBe('reports.list');
    expect(doc.projectSlug).toBe('proj-1');
    expect(doc.exceptionType).toBe('HttpException');
    expect(doc.exceptionMessage).toBe('oops');
    expect(Object.keys(doc).sort()).toEqual(
      [
        'exceptionMessage',
        'exceptionType',
        'method',
        'operation',
        'path',
        'projectSlug',
        'requestId',
        'stack',
        'statusCode',
        'timestamp'
      ].sort()
    );
    expect(doc).not.toHaveProperty('body');
    expect(doc).not.toHaveProperty('headers');
    expect(JSON.stringify(doc)).not.toContain('secret');
    expect(JSON.stringify(doc)).not.toContain('raw report payload');
  });

  it('prefers the client request id header and tolerates missing URLs', async () => {
    const { host, send } = buildHost({
      url: undefined as unknown as string,
      method: 'GET',
      id: 'normalized-req',
      headers: {
        'x-request-id': '22222222-2222-4222-8222-222222222222'
      }
    });

    await filter.catch(new Error('boom'), host);
    await Promise.resolve();

    const body = send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.requestId).toBe('22222222-2222-4222-8222-222222222222');
    const doc = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(doc.requestId).toBe('22222222-2222-4222-8222-222222222222');
    expect(doc.path).toBe('');
  });

  it('ignores malformed client request ids and falls back to the normalized server id', async () => {
    const { host, send, header } = buildHost({
      url: '/safe?token=secret',
      method: 'GET',
      id: 'server-req-id',
      headers: {
        'x-request-id': 'malicious\nrequest-id'
      }
    });

    await filter.catch(new Error('boom'), host);
    await Promise.resolve();

    expect(header).toHaveBeenCalledWith('x-request-id', 'server-req-id');
    const body = send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.requestId).toBe('server-req-id');
    expect(body.path).toBe('/safe');
    const doc = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(doc.requestId).toBe('server-req-id');
    expect(JSON.stringify(doc)).not.toContain('malicious');
  });

  it('swallows firestore failures so the response still completes', async () => {
    addDocMock.mockRejectedValueOnce(new Error('firestore down'));
    const errSpy = vi
      .spyOn(Logger, 'error')
      .mockImplementation(() => undefined);
    const { host, code } = buildHost({ url: '/q', method: 'GET' });

    await filter.catch(new HttpException('e', 400), host);
    await Promise.resolve();

    expect(code).toHaveBeenCalledWith(400);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
