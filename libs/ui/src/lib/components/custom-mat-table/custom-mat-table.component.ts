import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { XlsxProcessService } from '@data-access';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'lib-custom-mat-table',
  standalone: true,
  imports: [JsonPipe, MatTableModule],
  template: `
    @if (displayedDataSource; as dataSource) {
      <table mat-table [dataSource]="dataSource">
        @for (column of displayedColumns; track column) {
          <ng-container matColumnDef="{{ column }}">
            <th mat-header-cell *matHeaderCellDef>
              {{ column.replaceAll('__EMPTY', 'empty_title') }}
            </th>
            <td mat-cell *matCellDef="let element">
              @if (xlsxProcessService.isRenderingJson) {
                <pre style="padding: 5px 0">{{ element[column] | json }} </pre>
              }
              @if (!xlsxProcessService.isRenderingJson) {
                <div>
                  {{ element[column] }}
                </div>
              }
            </td>
            ></ng-container
          >
        }

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    }
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomMatTableComponent {
  @Input() displayedDataSource!: any[];
  @Input() displayedColumns!: string[];

  constructor(public xlsxProcessService: XlsxProcessService) {}
}
