import { describe, expect, it, vi } from 'vitest';
import { FileReportsController } from './file-reports.controller';

describe('FileReportsController', () => {
  function build() {
    const projectFileReportService = {
      deleteReportFile: vi.fn().mockResolvedValue('deleted'),
      downloadReportFiles: vi.fn().mockResolvedValue('xlsx-buffer')
    };
    const testEventFileRepositoryService = {
      listFileReports: vi.fn().mockResolvedValue(['file-a.json'])
    };
    const controller = new FileReportsController(
      projectFileReportService as never,
      testEventFileRepositoryService as never
    );
    return {
      controller,
      projectFileReportService,
      testEventFileRepositoryService
    };
  }

  it('delegates deleteReportFile to ProjectFileReportService', async () => {
    const { controller, projectFileReportService } = build();
    const result = await controller.deleteReportFile('proj-1', '/tmp/a.json');
    expect(projectFileReportService.deleteReportFile).toHaveBeenCalledWith(
      'proj-1',
      '/tmp/a.json'
    );
    expect(result).toBe('deleted');
  });

  it('delegates getReportFiles to the test-event repository', async () => {
    const { controller, testEventFileRepositoryService } = build();
    const result = await controller.getReportFiles('proj-1');
    expect(testEventFileRepositoryService.listFileReports).toHaveBeenCalledWith(
      'proj-1'
    );
    expect(result).toEqual(['file-a.json']);
  });

  it('delegates downloadReportFiles to ProjectFileReportService', async () => {
    const { controller, projectFileReportService } = build();
    const result = await controller.downloadReportFiles('proj-1', [
      'evt-1',
      'evt-2'
    ]);
    expect(projectFileReportService.downloadReportFiles).toHaveBeenCalledWith(
      'proj-1',
      ['evt-1', 'evt-2']
    );
    expect(result).toBe('xlsx-buffer');
  });
});
