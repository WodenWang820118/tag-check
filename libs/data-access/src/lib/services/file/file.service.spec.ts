import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileService);
  });

  it('returns an observable that emits the file ArrayBuffer', async () => {
    const buffer = new ArrayBuffer(8);
    const file = {
      arrayBuffer: vi.fn().mockResolvedValue(buffer)
    } as unknown as File;

    const result = await firstValueFrom(service.loadFile(file));

    expect(file.arrayBuffer).toHaveBeenCalledOnce();
    expect(result).toBe(buffer);
  });

  it('propagates errors raised by File.arrayBuffer', async () => {
    const error = new Error('read failure');
    const file = {
      arrayBuffer: vi.fn().mockRejectedValue(error)
    } as unknown as File;

    await expect(firstValueFrom(service.loadFile(file))).rejects.toBe(error);
  });
});
