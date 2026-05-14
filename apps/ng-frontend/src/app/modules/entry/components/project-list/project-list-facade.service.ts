import { Injectable, inject, signal, computed } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Project } from '@utils';
import { MetadataSourceService } from '../../../../shared/services/data-source/metadata-source.service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectListFacadeService {
  private readonly metadataSourceService = inject(MetadataSourceService);
  private readonly projectsSignal = signal<Project[]>([]);
  private readonly filterSignal = computed(() =>
    this.metadataSourceService.getFilterSignal().toLowerCase()
  );

  readonly dataSource = new MatTableDataSource<Project>();
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

  constructor() {
    this.setupFilterPredicate();
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: Project, filter: string) =>
      Object.values(data).some((value) =>
        JSON.stringify(value).toLowerCase().includes(filter)
      );
  }

  /** Loads and emits the full project list from the metadata source into the table data source. */
  initializeData(): void {
    this.metadataSourceService
      .getData()
      .pipe(map((projects) => projects || []))
      .subscribe((projects) => {
        this.projectsSignal.set(projects);
        this.dataSource.data = projects;
      });
  }

  /** Attaches a paginator to the table data source. */
  setPaginator(paginator: MatPaginator): void {
    this.dataSource.paginator = paginator;
  }
}
