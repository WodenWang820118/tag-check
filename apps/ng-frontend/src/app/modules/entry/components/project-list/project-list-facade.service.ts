import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Project } from '@utils';
import { MetadataSourceService } from '../../../../shared/services/data-source/metadata-source.service';
import { map } from 'rxjs';

/**
 * The home page's project cards: the project list from MetadataSourceService,
 * filtered by the toolbar's search and paged by the list's paginator.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectListFacadeService {
  private readonly metadataSourceService = inject(MetadataSourceService);
  // A root service subscribes once for the app's lifetime, however often
  // the home page is shown.
  private readonly projects = toSignal(
    this.metadataSourceService
      .getData()
      .pipe(map((projects) => projects || [])),
    { initialValue: [] as Project[] }
  );
  private readonly filter = computed(() =>
    this.metadataSourceService.getFilterSignal().toLowerCase()
  );

  readonly dataSource = new MatTableDataSource<Project>();
  readonly hidePaginator = computed(() => this.projects().length <= 5);
  readonly dataSourceLength = computed(() => this.projects().length);
  /**
   * The cards of the current page, as an observable for the async pipe. The
   * data source filters and pages; this feeds it the list and the search.
   */
  readonly filteredProjects = computed(() => {
    this.dataSource.data = this.projects();
    // Set even when empty: clearing the search must show every project.
    this.dataSource.filter = this.filter();
    return this.dataSource.connect();
  });

  constructor() {
    this.dataSource.filterPredicate = (data: Project, filter: string) =>
      Object.values(data).some((value) =>
        JSON.stringify(value).toLowerCase().includes(filter)
      );
  }

  /** Attaches the list's paginator to the data source. */
  setPaginator(paginator: MatPaginator): void {
    this.dataSource.paginator = paginator;
  }
}
