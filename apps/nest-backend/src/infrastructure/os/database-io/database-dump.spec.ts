/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi, afterEach } from 'vitest';
import { createWriteStream } from 'fs';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { DataSource, EntityMetadata } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DatabaseDumpService } from './database-dump.service';

// Mock the fs and path modules
vi.mock('fs', () => ({
  createWriteStream: vi.fn(() => ({
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn((event, callback) => {
      if (event === 'finish') {
        callback();
      }
      return this;
    })
  })),
  mkdirSync: vi.fn()
}));

vi.mock('path', () => ({
  dirname: vi.fn(() => 'mocked-directory'),
  join: vi.fn((dir, file) => `${dir}/${file}`)
}));

describe('DatabaseDumpService', () => {
  let service: DatabaseDumpService;
  let mockDataSource: Partial<DataSource>;
  let logSpy: any;
  let mockWriteStream: any;
  let mockProjectRepository: any;

  beforeEach(async () => {
    // Create mock objects
    mockWriteStream = {
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return mockWriteStream;
      })
    };

    mockProjectRepository = {
      findOne: vi.fn().mockResolvedValue({ id: 123 })
    };

    // Create a mock DataSource that can handle string-based repository lookups
    mockDataSource = {
      getRepository: vi.fn().mockImplementation((entityName) => {
        if (entityName === 'project') {
          return mockProjectRepository;
        }
        return {
          findOne: vi.fn().mockResolvedValue([])
        };
      }),
      entityMetadatas: [
        { name: 'project' } as EntityMetadata,
        { name: 'entity2' } as EntityMetadata
      ]
    };

    // Spy on Logger.prototype.log
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => void 0);

    // Setup the mock for createWriteStream
    (createWriteStream as any).mockReturnValue(mockWriteStream);

    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseDumpService]
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

    service = module.get<DatabaseDumpService>(DatabaseDumpService);

    // Mock the dumpEntityData method since we're not testing it directly
    service.dumpEntityData = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    logSpy.mockRestore();
  });

  describe('dumpProjectDatabase', () => {
    it('should create directory if it does not exist', async () => {
      // Arrange
      const projectSlug = 'test-project';
      const outputPath = 'mocked-directory/output.sql';
      mockProjectRepository.findOne.mockResolvedValue({ id: 123 });

      // Act
      await service.dumpProjectDatabase(projectSlug, outputPath);

      // Assert
      expect(dirname).toHaveBeenCalledWith(outputPath);
      expect(mkdirSync).toHaveBeenCalledWith('mocked-directory', {
        recursive: true
      });
    });

    it('should append .sql extension if not provided', async () => {
      // Arrange
      const projectSlug = 'test-project';
      const outputPath = '/path/to/output';
      mockProjectRepository.findOne.mockResolvedValue({
        id: 123
      });

      // Act
      await service.dumpProjectDatabase(projectSlug, outputPath);

      // Assert
      expect(join).toHaveBeenCalledWith(outputPath, 'test-project_dump.sql');
    });

    it('should throw error if project not found', async () => {
      // Arrange
      const projectSlug = 'non-existent-project';
      const outputPath = '/path/to/output.sql';

      // Mock the repository to return null (project not found)
      const mockProjectRepository = {
        findOne: vi.fn().mockResolvedValue(null)
      };

      // Mock the dataSource.getRepository to return our mock repository
      (mockDataSource.getRepository as any).mockReturnValue(
        mockProjectRepository
      );

      // Act & Assert
      await expect(
        service.dumpProjectDatabase(projectSlug, outputPath)
      ).rejects.toThrowError(
        `Project with projectSlug ${projectSlug} not found`
      );

      // Verify the repository was called with the correct parameters
      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { projectSlug: projectSlug }
      });
    });

    it('should write SQL transaction statements to file', async () => {
      // Arrange
      const projectSlug = 'test-project';
      const outputPath = '/path/to/output.sql';
      const projectId = 123;
      mockProjectRepository.findOne.mockResolvedValue({
        id: projectId
      });

      // Act
      await service.dumpProjectDatabase(projectSlug, outputPath);

      // Assert
      expect(mockWriteStream.end).toHaveBeenCalled();
    });

    it('should handle errors during dump process', async () => {
      // Arrange
      const projectSlug = 'example-project-slug';
      const outputPath = '/path/to/output.sql';
      mockProjectRepository.findOne.mockResolvedValue({
        id: 123
      });

      service.dumpEntityData = vi.fn().mockImplementation(() => {
        throw new Error('Dump error');
      });

      // Act & Assert
      await expect(
        service.dumpProjectDatabase(projectSlug, outputPath)
      ).rejects.toThrow('Dump error');
      expect(mockWriteStream.end).toHaveBeenCalled();
    });

    it('should log start and completion of database dump', async () => {
      // Arrange
      const projectSlug = 'example-project-slug';
      const outputPath = '/path/to/output.sql';
      mockProjectRepository.findOne.mockResolvedValue({
        id: 123
      });

      // Act
      await service.dumpProjectDatabase(projectSlug, outputPath);

      // Assert
      // Get the mock instance of Logger
      expect(logSpy).toHaveBeenCalledWith(
        `Dumping database for project ${projectSlug} to ${outputPath}`
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Database dump completed for project ${projectSlug}`
      );
    });
  });
});
