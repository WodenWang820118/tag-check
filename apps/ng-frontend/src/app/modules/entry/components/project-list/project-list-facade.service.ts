import { Injectable, signal, computed } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ProjectInfo } from '@utils';
import { MetadataSourceService } from '../../../../shared/services/data-source/metadata-source.service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectListFacadeService {
  private projectsSignal = signal<ProjectInfo[]>([]);
  private filterSignal = computed(() =>
    this.metadataSourceService.getFilterSignal().toLowerCase()
  );

  readonly dataSource = new MatTableDataSource<ProjectInfo>();
  readonly hidePaginator = computed(() => this.projectsSignal().length <= 5);
  readonly dataSourceLength = computed(() => this.projectsSignal().length);
  readonly filteredProjects = computed(() => {
    const projects = this.projectsSignal();
    const filter = this.filterSignal();

    this.dataSource.data = projects;
    if (filter) {
      this.dataSource.filter = filter;
    }
    return this.dataSource.connect();
  });

  constructor(private metadataSourceService: MetadataSourceService) {
    this.setupFilterPredicate();
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: ProjectInfo, filter: string) =>
      Object.values(data).some((value) =>
        String(value).toLowerCase().includes(filter)
      );
  }

  initializeData(): void {
    this.metadataSourceService
      .getData()
      .pipe(map((projects) => projects || []))
      .subscribe((projects) => {
        this.projectsSignal.set(projects);
        this.dataSource.data = projects;
      });
  }

  setPaginator(paginator: MatPaginator): void {
    this.dataSource.paginator = paginator;
  }
}
