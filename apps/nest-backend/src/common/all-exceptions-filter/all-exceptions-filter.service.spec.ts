import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpException,
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

function buildHost(req: { url: string; method: string }) {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const response = { status, json };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => req
    })
  } as unknown as ArgumentsHost;
  return { host, status, json };
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
    const { host, status, json } = buildHost({ url: '/x', method: 'GET' });
    await filter.catch(new NotFoundException('missing'), host);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(404);
    expect(body.path).toBe('/x');
    expect(body.message).toBeDefined();
  });

  it('uses 500 + Internal Server Error for unknown exceptions', async () => {
    const { host, status, json } = buildHost({ url: '/y', method: 'POST' });
    await filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.message).toBe('Internal Server Error');
  });

  it('logs errors to firestore via the FirebaseService collection', async () => {
    const { host } = buildHost({ url: '/z', method: 'PUT' });
    await filter.catch(new HttpException('oops', 400), host);

    expect(firebase.getFirestore).toHaveBeenCalled();
    expect(firebase.getErrorCollectionName).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith({ __db: true }, 'errors');
    expect(addDocMock).toHaveBeenCalledTimes(1);
    const doc = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(doc.path).toBe('/z');
    expect(doc.method).toBe('PUT');
    expect(doc.status).toBe(400);
  });

  it('swallows firestore failures so the response still completes', async () => {
    addDocMock.mockRejectedValueOnce(new Error('firestore down'));
    const errSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { host, status } = buildHost({ url: '/q', method: 'GET' });

    await filter.catch(new HttpException('e', 400), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
