import { Observable } from 'rxjs';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { XlsxProcessService } from '../../services/xlsx-process/xlsx-process.service';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-custom-mat-table',
  standalone: true,
  imports: [SharedModule],
  template: `
    @if (displayedDataSource$ | async; as dataSource) {

    <table mat-table [dataSource]="dataSource">
      @for (column of displayedColumns$ | async; track column) {
      <ng-container matColumnDef="{{ column }}">
        <th mat-header-cell *matHeaderCellDef>
          {{ column.replace('__EMPTY', 'empty_title') }}
        </th>
        <td mat-cell *matCellDef="let element">
          @if (xlsxProcessService.getIsRenderingJson() | async) {
          <pre style="padding: 5px 0">{{ element[column] | json }} </pre>
          } @if (!(xlsxProcessService.getIsRenderingJson() | async)) {
          <div>
            {{ element[column] }}
          </div>
          }
        </td>
        ></ng-container
      >
      }

      <tr mat-header-row *matHeaderRowDef="displayedColumns$ | async"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns$ | async"></tr>
    </table>

    }
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomMatTableComponent {
  @Input() displayedDataSource$!: Observable<any[]>;
  @Input() displayedColumns$!: Observable<string[]>;

  constructor(public xlsxProcessService: XlsxProcessService) {}
}
