import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  model,
  viewChild
} from '@angular/core';
import { ProjectItemComponent } from '../project-item/project-item.component';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AsyncPipe } from '@angular/common';
import { ProjectListFacadeService } from './project-list-facade.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ProjectItemComponent, MatCardModule, MatPaginator, AsyncPipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent implements AfterViewInit {
  readonly paginator = viewChild.required<MatPaginator>('paginator');
  readonly hidePaginator = this.facade.hidePaginator;
  readonly dataSourceLength = this.facade.dataSourceLength;
  readonly displayedProjects = this.facade.filteredProjects;

  pageIndex = model<number>(0);

  constructor(private readonly facade: ProjectListFacadeService) {}

  ngAfterViewInit(): void {
    this.facade.setPaginator(this.paginator());
    this.facade.initializeData();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
  }
}
