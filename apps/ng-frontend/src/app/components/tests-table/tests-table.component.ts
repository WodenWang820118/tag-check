import { ProjectDataSourceService } from '../../services/project-data-source/project-data-source.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProjectService } from '../../services/project/project.service';
import { MatIconModule } from '@angular/material/icon';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { combineLatest, take, tap } from 'rxjs';
import { TestCase } from '../../models/project.interface';
import { RouterModule } from '@angular/router';
import { TestCaseService } from '../../services/test-case/test-case.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-tests-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatPaginatorModule,
    MatInputModule,
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  templateUrl: './tests-table.component.html',
  styleUrls: ['./tests-table.component.scss'],
})
export class TestsTableComponent {
  columnsToDisplay = ['eventName', 'passed', 'completedTime'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: TestCase | null = null;

  testDataSource!: MatTableDataSource<TestCase>;
  dataToDisplay: TestCase[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private projectService: ProjectService,
    private testCaseService: TestCaseService,
    private projectDataSourceService: ProjectDataSourceService
  ) {
    projectService.currentProject$.subscribe((project) => {
      this.testDataSource = new MatTableDataSource(project.reports);
      this.testDataSource.paginator = this.paginator;
      this.testDataSource.sort = this.sort;
      this.projectDataSourceService.setData(project.reports);
    });
  }

  addTest(test: TestCase) {
    this.dataToDisplay = [...this.dataToDisplay, test];
    this.projectDataSourceService.setData(this.dataToDisplay);
    // TODO: add a new test case to the project

    combineLatest([
      this.projectService.currentProject$,
      this.projectDataSourceService.connect(),
    ])
      .pipe(
        tap(([project, data]) => {
          project.specs = data;
          this.projectService.updateProject(project);
        })
      )
      .subscribe();
  }

  setTestCase(eventName: string) {
    combineLatest([this.projectService.currentProject$])
      .pipe(
        take(1),
        tap(([project]) => {
          if (!project) return;
          const testCase = project.reports.find(
            (item) => item.eventName === eventName
          );
          this.testCaseService.setTestCase(testCase);
        })
      )
      .subscribe();
  }
}
