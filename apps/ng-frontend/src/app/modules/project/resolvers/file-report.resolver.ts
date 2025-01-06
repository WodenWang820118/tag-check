import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { FileReport } from '@utils';
import { FileReportService } from '../../../shared/services/api/file-report/file-report.service';
import { tap } from 'rxjs';
import { FileTableDataSourceFacadeService } from '../../../shared/services/facade/file-table-data-source-facade.service';
import { FileTableDataSourceService } from '../../../shared/services/file-table-data-source/file-table-data-source.service';

export const getFileReportResolver: ResolveFn<FileReport[] | null> = (
  route,
  state
) => {
  const fileReportService = inject(FileReportService);
  const fileTableDataSourceService = inject(FileTableDataSourceService);
  const fileTableDataSourceFacadeService = inject(
    FileTableDataSourceFacadeService
  );

  if (!route.parent) {
    return null;
  }

  console.log(route.parent.params['projectSlug']);
  return fileReportService
    .getFileReports(route.parent.params['projectSlug'])
    .pipe(
      tap((data) => {
        if (!data) {
          return;
        }

        fileTableDataSourceService.setData(
          fileTableDataSourceFacadeService.preprocessData(data)
        );
      })
    );
};
