import { TestBed } from '@angular/core/testing';
import { XlsxProcessService } from '@data-access';
import { CustomMatTableComponent } from './custom-mat-table.component';

describe('CustomMatTableComponent', () => {
  let xlsxProcessService: { isRenderingJson: boolean };

  beforeEach(async () => {
    xlsxProcessService = { isRenderingJson: false };
    await TestBed.configureTestingModule({
      imports: [CustomMatTableComponent],
      providers: [{ provide: XlsxProcessService, useValue: xlsxProcessService }]
    }).compileComponents();
  });

  it('renders the configured columns and rows', () => {
    const fixture = TestBed.createComponent(CustomMatTableComponent);
    fixture.componentInstance.displayedColumns = ['name', 'value'];
    fixture.componentInstance.displayedDataSource = [
      { name: 'a', value: 1 },
      { name: 'b', value: 2 }
    ];
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('td');
    expect(cells.length).toBe(4);
    expect(cells[0].textContent.trim()).toBe('a');
    expect(cells[3].textContent.trim()).toBe('2');
  });

  it('replaces __EMPTY in column headers with empty_title', () => {
    const fixture = TestBed.createComponent(CustomMatTableComponent);
    fixture.componentInstance.displayedColumns = ['__EMPTY'];
    fixture.componentInstance.displayedDataSource = [{ __EMPTY: 'x' }];
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('th');
    expect(header.textContent.trim()).toBe('empty_title');
  });

  it('does not render the table when no data source is provided', () => {
    const fixture = TestBed.createComponent(CustomMatTableComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });
});
