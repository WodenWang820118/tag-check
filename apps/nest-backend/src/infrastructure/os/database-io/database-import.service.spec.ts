/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { DataSource, QueryRunner } from 'typeorm';
import { Logger, HttpException } from '@nestjs/common';
import { DatabaseImportService } from './database-import.service';

// Mock the fs and path modules
vi.mock('fs', () => ({
  readFileSync: vi.fn()
}));

vi.mock('path', () => ({
  resolve: vi.fn((path) => path)
}));

describe('DatabaseImportService', () => {
  let service: DatabaseImportService;
  let mockDataSource: Partial<DataSource>;
  let mockQueryRunner: Partial<QueryRunner>;
  let logSpy: any;
  let errorSpy: any;
  let isTransactionActive: boolean;

  beforeEach(async () => {
    // Create mock query runner
    isTransactionActive = false;
    mockQueryRunner = {
      connect: vi.fn().mockResolvedValue(undefined),
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue(undefined),
      get isTransactionActive() {
        return isTransactionActive;
      }
    };

    // Create a mock DataSource
    mockDataSource = {
      createQueryRunner: vi.fn().mockReturnValue(mockQueryRunner)
    };

    // Spy on Logger methods
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => void 0);
    errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => void 0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseImportService]
    })
      .useMocker((token) => {
        if (token === DataSource) {
          return mockDataSource;
        }
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = module.get<DatabaseImportService>(DatabaseImportService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('importProjectDatabase', () => {
    it('should handle transaction errors and rollback', async () => {
      // Mock SQL content
      const mockSqlContent = "INSERT INTO users VALUES (1, 'test');";
      (readFileSync as any).mockReturnValue(mockSqlContent);

      // Mock first query to throw a generic error (not rewriteable)
      const error = new Error('Database error');
      (mockQueryRunner.query as any).mockRejectedValueOnce(error);

      // Mock isTransactionActive as a getter that returns true
      Object.defineProperty(mockQueryRunner, 'isTransactionActive', {
        get: vi.fn(() => true)
      });

      // Call the method and expect it to throw
      await expect(
        service.importProjectDatabase('path/to/sql/file.sql')
      ).rejects.toThrowError(HttpException);

      // Verify logs (implementation now logs only the path)
      expect(logSpy).toHaveBeenCalledWith(
        'Importing database from path/to/sql/file.sql'
      );
      expect(errorSpy).toHaveBeenCalledWith('Failed to import database', error);

      // Verify transaction was rolled back and query runner released
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should release query runner even if connection fails', async () => {
      // Mock SQL content
      const mockSqlContent = "INSERT INTO users VALUES (1, 'test');";
      (readFileSync as any).mockReturnValue(mockSqlContent);

      // Mock connect to throw an error
      const error = new Error('Connection error');
      (mockQueryRunner.connect as any).mockRejectedValueOnce(error);

      // Call the method and expect it to throw
      await expect(
        service.importProjectDatabase('path/to/sql/file.sql')
      ).rejects.toThrow(HttpException);

      // Verify query runner was released
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rewrite legacy INSERT with non-existent columns and succeed', async () => {
      const mockSqlContent = `-- Data for entity: ProjectEntity (table: project)\nINSERT INTO "project" ("id", "project_slug", "testEvents") VALUES (1, 'slug', NULL);`;
      (readFileSync as any).mockReturnValue(mockSqlContent);

      // Simulate PRAGMA table_info(project) returning only id and project_slug
      const pragmaRows = [{ name: 'id' }, { name: 'project_slug' }];

      // First call: PRAGMA foreign_keys = OFF
      // Second call: failing INSERT
      // Third call: PRAGMA table_info(...)
      // Fourth call: rewritten INSERT
      // Fifth call: PRAGMA foreign_keys = ON
      const noColumnErr = Object.assign(
        new Error('SQLITE_ERROR: table project has no column named testEvents'),
        {
          code: 'SQLITE_ERROR'
        }
      );

      (mockQueryRunner.query as any)
        .mockResolvedValueOnce(undefined) // PRAGMA foreign_keys = OFF
        .mockRejectedValueOnce(noColumnErr) // original INSERT fails
        .mockResolvedValueOnce(pragmaRows) // PRAGMA table_info
        .mockResolvedValueOnce(undefined) // rewritten INSERT succeeds
        .mockResolvedValueOnce(undefined); // PRAGMA foreign_keys = ON

      await expect(
        service.importProjectDatabase('path/to/sql/file.sql')
      ).resolves.toBeUndefined();

      // Ensure rewritten INSERT attempted
      const calls = (mockQueryRunner.query as any).mock.calls.map(
        (c: any[]) => c[0]
      );
      expect(
        calls.some((c: string) =>
          /INSERT OR REPLACE INTO\s+"project"\s*\(\s*"id",\s*"project_slug"\s*\)\s*VALUES\s*\(/i.test(
            c
          )
        )
      ).toBe(true);
    });
  });
});
