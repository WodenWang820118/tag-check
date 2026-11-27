import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { EditorFacadeService } from '@data-access';
import { parseMeasurementPlanRows, type StrictDataLayerEvent } from '@utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as spreadsheet from '../file-upload-dialog/measurement-plan-spreadsheet';
import { parseCsvToTable } from '../file-upload-dialog/measurement-plan-spreadsheet';
import { PlanEditorDialogComponent } from './plan-editor-dialog.component';
import { PlanEditorService } from './plan-editor.service';

describe('PlanEditorDialogComponent', () => {
  let fixture: ComponentFixture<PlanEditorDialogComponent>;
  let component: PlanEditorDialogComponent;
  let planEditorService: PlanEditorService;
  let editorFacade: { inputJsonContent: unknown };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    editorFacade = { inputJsonContent: null };
    dialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PlanEditorDialogComponent],
      providers: [
        PlanEditorService,
        { provide: EditorFacadeService, useValue: editorFacade },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    }).compileComponents();

    planEditorService = TestBed.inject(PlanEditorService);
    planEditorService.setRows([
      { eventName: '', eventParameters: '', itemParameters: '' }
    ]);

    fixture = TestBed.createComponent(PlanEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with one empty row and disabled Use plan button', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);

    const firstRow = fixture.nativeElement.querySelector(
      '[data-testid="plan-editor-row-0"]'
    );
    expect(firstRow).not.toBeNull();

    const eventNameInput = fixture.nativeElement.querySelector(
      '[data-testid="plan-editor-event-name-0"]'
    );
    expect(eventNameInput).not.toBeNull();
    expect(eventNameInput.value).toBe('');

    const usePlanButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('[data-testid="plan-editor-use"]');
    expect(usePlanButton).not.toBeNull();
    expect(usePlanButton?.disabled).toBe(true);

    const issues = fixture.nativeElement.querySelector(
      '[data-testid="plan-editor-issues"]'
    );
    expect(issues).toBeNull();
  });

  it('appends a row when Add event is clicked', () => {
    const addBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('[data-testid="plan-editor-add"]');
    addBtn?.click();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    expect(
      fixture.nativeElement.querySelector('[data-testid="plan-editor-row-1"]')
    ).not.toBeNull();
  });

  it('deletes a row when its delete button is clicked', () => {
    component.addEvent();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);

    const deleteBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="plan-editor-delete-0"]'
      );
    deleteBtn?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('shows issues under the table when validation fails and keeps Use plan disabled', () => {
    const eventNameInput: HTMLInputElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="plan-editor-event-name-0"]'
      );
    if (!eventNameInput) throw new Error('input not found');

    eventNameInput.value = 'invalid event name with spaces';
    eventNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const issuesEl = fixture.nativeElement.querySelector(
      '[data-testid="plan-editor-issues"]'
    );
    expect(issuesEl).not.toBeNull();
    expect(issuesEl?.textContent).toContain('Event name');
    // Numbered as the table shows it, not as the CSV line with its header.
    expect(issuesEl?.textContent).toContain('Row 1:');

    const usePlanButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('[data-testid="plan-editor-use"]');
    expect(usePlanButton?.disabled).toBe(true);
  });

  it('converts valid rows, writes specs to editor facade and closes dialog on Use plan', () => {
    planEditorService.setRows([
      {
        eventName: 'purchase',
        eventParameters: 'currency=TWD, value',
        itemParameters: 'item_id, price'
      }
    ]);
    fixture.detectChanges();

    const usePlanButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('[data-testid="plan-editor-use"]');
    expect(usePlanButton?.disabled).toBe(false);

    usePlanButton?.click();

    expect(editorFacade.inputJsonContent).not.toBeNull();
    const specs = editorFacade.inputJsonContent as StrictDataLayerEvent[];
    expect(Array.isArray(specs)).toBe(true);
    expect(specs[0].event).toBe('purchase');
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('downloads CSV content that round-trips through parseCsvToTable and parseMeasurementPlanRows', () => {
    let capturedCsv = '';
    let capturedFileName = '';
    vi.spyOn(spreadsheet, 'downloadCsv').mockImplementation(
      (csv: string, fileName: string) => {
        capturedCsv = csv;
        capturedFileName = fileName;
      }
    );

    planEditorService.setRows([
      {
        eventName: 'purchase',
        eventParameters: 'transaction_id=/^T\\d+$/, currency=TWD, value',
        itemParameters: 'item_id, item_name, price'
      },
      {
        eventName: 'login',
        eventParameters: 'method=email',
        itemParameters: ''
      }
    ]);
    fixture.detectChanges();

    const downloadBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="plan-editor-download"]'
      );
    downloadBtn?.click();

    expect(capturedFileName).toBe('ga4-measurement-plan.csv');
    expect(capturedCsv).toContain(
      'event_name,event_parameters,item_parameters'
    );

    const table = parseCsvToTable(capturedCsv);
    expect(table.length).toBe(3);

    const { rows, issues } = parseMeasurementPlanRows(table);
    expect(issues).toEqual([]);
    expect(rows.length).toBe(2);
    expect(rows[0].eventName).toBe('purchase');
    expect(rows[1].eventName).toBe('login');
  });

  it('preserves typed rows across dialog instances using PlanEditorService', () => {
    planEditorService.setRows([
      {
        eventName: 'custom_conversion',
        eventParameters: 'lead_id, score',
        itemParameters: ''
      }
    ]);

    const secondFixture = TestBed.createComponent(PlanEditorDialogComponent);
    secondFixture.detectChanges();

    const nameInput: HTMLInputElement | null =
      secondFixture.nativeElement.querySelector(
        '[data-testid="plan-editor-event-name-0"]'
      );
    expect(nameInput?.value).toBe('custom_conversion');
  });

  it('keeps every typed cell in the service', () => {
    const type = (testId: string, value: string) => {
      const input: HTMLInputElement | null =
        fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
      if (!input) throw new Error(`${testId} not found`);
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };

    type('plan-editor-event-name-0', 'add_to_cart');
    type('plan-editor-event-parameters-0', 'currency=USD, value');
    type('plan-editor-item-parameters-0', 'item_id, price');

    expect(planEditorService.rows()).toEqual([
      {
        eventName: 'add_to_cart',
        eventParameters: 'currency=USD, value',
        itemParameters: 'item_id, price'
      }
    ]);
  });

  it('adds an empty row when opened with no rows', () => {
    planEditorService.setRows([]);

    const reopened = TestBed.createComponent(PlanEditorDialogComponent);
    reopened.detectChanges();

    expect(planEditorService.rows()).toHaveLength(1);
  });

  it('does not use a plan that has issues', () => {
    planEditorService.setRows([
      { eventName: 'Bad Name!', eventParameters: '', itemParameters: '' }
    ]);

    component.usePlan();

    expect(editorFacade.inputJsonContent).toBeNull();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('leaves blank rows out of the downloaded CSV', () => {
    let capturedCsv = '';
    vi.spyOn(spreadsheet, 'downloadCsv').mockImplementation((csv: string) => {
      capturedCsv = csv;
    });
    planEditorService.setRows([
      { eventName: '', eventParameters: '', itemParameters: '' },
      { eventName: 'login', eventParameters: 'method', itemParameters: '' },
      { eventName: ' ', eventParameters: '', itemParameters: '' }
    ]);

    component.downloadCsv();

    expect(parseCsvToTable(capturedCsv)).toEqual([
      ['event_name', 'event_parameters', 'item_parameters'],
      ['login', 'method', '']
    ]);
  });
});

describe('PlanEditorService', () => {
  it('ignores updates to a row that does not exist', () => {
    const service = new PlanEditorService();
    const before = service.rows();

    service.updateRow(3, 'eventName', 'purchase');

    expect(service.rows()).toBe(before);
  });

  it('appends a given row', () => {
    const service = new PlanEditorService();
    const row = { eventName: 'login', eventParameters: '', itemParameters: '' };

    service.addRow(row);

    expect(service.rows()).toEqual([
      { eventName: '', eventParameters: '', itemParameters: '' },
      row
    ]);
  });
});
