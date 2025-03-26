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

      // Mock query to throw an error
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

      // Verify logs
      expect(logSpy).toHaveBeenCalledWith(
        'Importing database from path/to/sql/file.sql',
        mockSqlContent
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
  });
});
