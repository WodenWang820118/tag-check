import { toSignal } from '@angular/core/rxjs-interop';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  signal,
  viewChild
} from '@angular/core';
import { ProjectItemComponent } from '../project-item/project-item.component';
import { MatCardModule } from '@angular/material/card';
import { MetadataSourceService } from '../../../../shared/services/metadata-source/metadata-source.service';
import { MetadataSourceFacadeService } from '../../../../shared/services/facade/metadata-source-facade.service';
import { map } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { ProjectInfo } from '@utils';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ProjectItemComponent, MatCardModule, MatPaginator, AsyncPipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent implements AfterViewInit {
  // Table
  dataSource = new MatTableDataSource<ProjectInfo>();

  // Paginator reference
  paginator = viewChild.required<MatPaginator>('paginator');

  private filterSignal = toSignal(
    this.metadataSourceFacadeService.observeTableFilter(),
    { initialValue: '' }
  );

  private projectsSignal = signal<ProjectInfo[]>([]);

  // Computed signals for derived state
  dataSourceLength = computed(() => this.projectsSignal().length);
  hidePaginator = computed(() => this.dataSourceLength() <= 5);

  // Computed signal for filtered and paginated projects
  displayedProjects = computed(() => {
    const projects = this.projectsSignal();
    const filter = this.filterSignal().toLowerCase();

    // Update the data source with the current projects
    this.dataSource.data = projects;

    // Apply filter
    if (filter) {
      this.dataSource.filter = filter;
    }

    // Return the paginated and filtered data
    return this.dataSource.connect();
  });

  pageIndex = model<number>(0);

  constructor(
    private metadataSourceService: MetadataSourceService,
    private metadataSourceFacadeService: MetadataSourceFacadeService
  ) {
    // Set up custom filter predicate
    this.dataSource.filterPredicate = (data: ProjectInfo, filter: string) => {
      return Object.values(data).some((value) =>
        String(value).toLowerCase().includes(filter)
      );
    };
  }

  ngAfterViewInit() {
    // Set the paginator
    this.dataSource.paginator = this.paginator();

    // Initialize the data
    this.metadataSourceService
      .getData()
      .pipe(map((projects) => projects || []))
      .subscribe((projects) => {
        this.projectsSignal.set(projects);
        this.dataSource.data = projects;
      });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
  }
}
