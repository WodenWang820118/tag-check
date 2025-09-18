import { Injectable } from '@nestjs/common';
import { FullTestEventResponseDto } from '../../../../shared';

export interface ProjectInfo {
  projectName: string;
  projectSlug: string;
  projectDescription: string;
  measurementId: string;
}

@Injectable()
export class XlsxReportGroupingService {
  groupReportsByProject(
    reports: FullTestEventResponseDto[]
  ): Record<string, FullTestEventResponseDto[]> {
    const groups: Record<string, FullTestEventResponseDto[]> = {};
    for (const report of reports) {
      const projectInfo = this.extractProjectInfo(report);
      const key = `${projectInfo.projectName}-${projectInfo.projectSlug}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(report);
    }
    return groups;
  }

  extractProjectInfo(report: FullTestEventResponseDto): ProjectInfo {
    return {
      projectName: report.project.projectName || 'Unknown Project',
      projectSlug: report.project.projectSlug || 'unknown-project',
      projectDescription:
        report.project.projectDescription || 'No description available',
      measurementId: report.project.measurementId || 'No measurement ID'
    };
  }
}
