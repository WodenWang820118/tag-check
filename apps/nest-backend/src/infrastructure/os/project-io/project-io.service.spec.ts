import { describe, it, expect, vi } from 'vitest';
import { ProjectIoService } from './project-io.service';
import { ProjectCompressor } from './project-compressor.service';
import { ProjectUnzipper } from './project-unzipper.service';
import { HttpException } from '@nestjs/common';

describe('ProjectIoService', () => {
  function build(opts?: {
    compressError?: Error;
    unzipError?: Error;
    unzipResult?: string;
  }) {
    const compressor = {
      compress: vi.fn(async () => {
        if (opts?.compressError) throw opts.compressError;
      })
    } as unknown as ProjectCompressor;
    const unzipper = {
      unzip: vi.fn(async () => {
        if (opts?.unzipError) throw opts.unzipError;
        return opts?.unzipResult ?? 'slug';
      })
    } as unknown as ProjectUnzipper;
    return {
      svc: new ProjectIoService(compressor, unzipper),
      compressor,
      unzipper
    };
  }

  describe('compressProject', () => {
    it('delegates to the compressor', async () => {
      const { svc, compressor } = build();
      await svc.compressProject('/folder', '/out.zip', 'slug', []);
      expect(compressor.compress).toHaveBeenCalledWith(
        '/folder',
        '/out.zip',
        'slug',
        []
      );
    });

    it('wraps compressor failures in a 500 HttpException', async () => {
      const { svc } = build({ compressError: new Error('boom') });
      await expect(
        svc.compressProject('/folder', '/out.zip', 'slug')
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('unzipProject', () => {
    it('returns the slug from the unzipper', async () => {
      const { svc } = build({ unzipResult: 'real-slug' });
      const result = await svc.unzipProject('s', '/zip', '/out');
      expect(result).toBe('real-slug');
    });

    it('wraps unzipper failures in a 500 HttpException', async () => {
      const { svc } = build({ unzipError: new Error('bad zip') });
      await expect(
        svc.unzipProject('s', '/zip', '/out')
      ).rejects.toBeInstanceOf(HttpException);
    });
  });
});
