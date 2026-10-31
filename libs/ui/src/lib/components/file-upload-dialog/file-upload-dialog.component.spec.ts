import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { FileUploadDialogComponent } from './file-upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorFacadeService, EditorService } from '@data-access';
import { EditorTypeEnum } from '@utils';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('FileUploadDialogComponent', () => {
  let fixture: ComponentFixture<FileUploadDialogComponent>;
  let component: FileUploadDialogComponent;
  let dialog: {
    open: ReturnType<typeof vi.fn>;
    closeAll: ReturnType<typeof vi.fn>;
  };
  let editorFacade: { inputJsonContent: unknown };

  beforeEach(async () => {
    dialog = { open: vi.fn(), closeAll: vi.fn() };
    editorFacade = { inputJsonContent: null };

    await TestBed.configureTestingModule({
      imports: [FileUploadDialogComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: EditorFacadeService, useValue: editorFacade }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the download plan template action with testid tagbuild-plan-template-download', () => {
    const downloadBtn = fixture.nativeElement.querySelector(
      '[data-testid="tagbuild-plan-template-download"]'
    );
    expect(downloadBtn).not.toBeNull();
    expect(downloadBtn?.textContent).toContain('Download plan template');
  });

  it('triggers downloadPlanTemplate when the download button is clicked', () => {
    const spy = vi.spyOn(component, 'downloadPlanTemplate').mockResolvedValue();
    const downloadBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-plan-template-download"]'
      );
    downloadBtn?.click();
    expect(spy).toHaveBeenCalled();
  });

  describe('How to write a plan help section', () => {
    it('renders the collapsible help section with testid tagbuild-plan-help', () => {
      const helpEl: HTMLElement | null = fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-plan-help"]'
      );
      expect(helpEl).not.toBeNull();
      expect(helpEl?.tagName.toLowerCase()).toBe('details');

      const summary = helpEl?.querySelector('summary');
      expect(summary?.textContent?.trim()).toBe('How to write a plan');
    });

    it('links to Google recommended events reference and documentation page', () => {
      const helpEl: HTMLElement | null = fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-plan-help"]'
      );
      const links = helpEl?.querySelectorAll('a');
      const hrefs = Array.from(links ?? []).map((a) => a.getAttribute('href'));

      expect(
        hrefs.some(
          (href) =>
            href?.includes('developers.google.com/analytics') &&
            href.includes('reference/events')
        )
      ).toBe(true);

      expect(hrefs).toContain(
        'https://tag-check-documentation.vercel.app/documentation/measurement-plan'
      );
    });

    it('covers the three rule forms and dataLayer.push code generation', () => {
      const helpEl: HTMLElement | null = fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-plan-help"]'
      );
      const text = helpEl?.textContent ?? '';

      expect(text).toContain('currency');
      expect(text).toContain('currency=TWD');
      expect(text).toContain('transaction_id=/^T\\d+$/');
      expect(text).toContain('dataLayer.push');
      expect(text).toContain('For developers');
    });
  });

  describe('plan import with realistic parsed sheet tables', () => {
    it('imports a valid measurement plan sheet table into the input JSON editor', () => {
      const realisticParsedTable: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['login', 'method', ''],
        ['add_to_cart', 'currency, value', 'item_id, price']
      ];

      const handled = component.importPlanTable(realisticParsedTable);
      expect(handled).toBe(true);
      expect(dialog.closeAll).toHaveBeenCalled();
      expect(editorFacade.inputJsonContent).toEqual([
        {
          event: 'login',
          method: '$method'
        },
        {
          event: 'add_to_cart',
          ecommerce: {
            currency: '$currency',
            value: '$value',
            items: [
              {
                item_id: '$item_id',
                price: '$price'
              }
            ]
          }
        }
      ]);
    });

    it('shows issues in an error dialog when a plan sheet table has issues', () => {
      const tableWithIssues: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['1invalid_event_name', 'method', ''],
        ['purchase', 'currency, bad-param', 'item_id']
      ];

      const handled = component.importPlanTable(tableWithIssues);
      expect(handled).toBe(true);
      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message: expect.stringContaining('1invalid_event_name')
        }
      });
      expect(editorFacade.inputJsonContent).toBeNull();
    });

    it('shows error dialog when a plan sheet table contains no event rows', () => {
      const emptyPlanTable: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters']
      ];

      const handled = component.importPlanTable(emptyPlanTable);
      expect(handled).toBe(true);
      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message: 'The uploaded measurement plan contains no event rows.'
        }
      });
      expect(editorFacade.inputJsonContent).toBeNull();
    });

    it('returns false for sheets without the plan header to preserve today behaviour', () => {
      const todaySheetTable: string[][] = [
        ['dataLayer Specs'],
        ['window.dataLayer.push({ event: "custom_push" })']
      ];

      const handled = component.importPlanTable(todaySheetTable);
      expect(handled).toBe(false);
      expect(editorFacade.inputJsonContent).toBeNull();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  describe('importLegacySpecsTable', () => {
    it('imports specs from dataLayer Specs column, skipping resets', () => {
      const table: string[][] = [
        ['ID', 'dataLayer Specs', 'Comments'],
        [
          '1',
          "window.dataLayer.push({ ecommerce: null });\nwindow.dataLayer.push({ event: 'view_item', ecommerce: { items: [{ item_name: 'Hat' }] } });",
          'tested'
        ],
        [
          '2',
          "dataLayer.push({ event: 'purchase', ecommerce: { currency: 'USD', value: '49.99' } });",
          'verified'
        ]
      ];

      const handled = component.importLegacySpecsTable(table);
      expect(handled).toBe(true);
      expect(dialog.closeAll).toHaveBeenCalled();
      expect(editorFacade.inputJsonContent).toEqual([
        {
          event: 'view_item',
          ecommerce: { items: [{ item_name: 'Hat' }] }
        },
        {
          event: 'purchase',
          ecommerce: { currency: 'USD', value: '49.99' }
        }
      ]);
    });

    it('shows issues with spreadsheet row numbers in error dialog and imports nothing', () => {
      const table: string[][] = [
        ['dataLayer Specs'],
        ["window.dataLayer.push({ event: 'valid_event' });"],
        ['window.dataLayer.push({ event: broken payload {{{%% });']
      ];

      const handled = component.importLegacySpecsTable(table);
      expect(handled).toBe(true);
      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message: expect.stringContaining('Row 3:')
        }
      });
      expect(editorFacade.inputJsonContent).toBeNull();
    });

    it('shows error dialog when a legacy sheet contains no dataLayer.push event call', () => {
      const resetOnlyTable: string[][] = [
        ['dataLayer Specs'],
        ['window.dataLayer.push({ ecommerce: null });']
      ];

      const handled = component.importLegacySpecsTable(resetOnlyTable);
      expect(handled).toBe(true);
      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message:
            'The uploaded sheet contained no dataLayer.push call with an event.'
        }
      });
      expect(editorFacade.inputJsonContent).toBeNull();
    });

    it('returns false when table does not have a dataLayer Specs column', () => {
      const table: string[][] = [
        ['some_column', 'other_column'],
        ['value1', 'value2']
      ];

      const handled = component.importLegacySpecsTable(table);
      expect(handled).toBe(false);
      expect(editorFacade.inputJsonContent).toBeNull();
    });
  });

  describe('choosing a file (dialog routing)', () => {
    const select = (file: File) =>
      component.onFileSelected({
        target: { files: [file] }
      } as unknown as Event);

    it('shows the spreadsheet error message without an extra Error prefix', async () => {
      await select(
        new File(
          ['event_name,event_parameters,item_parameters\n"unterminated'],
          'broken.csv'
        )
      );

      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message:
            'Failed to read spreadsheet file: Line 2: unterminated quoted cell.'
        }
      });
    });

    it('imports a CSV measurement plan into the input JSON editor', async () => {
      await select(
        new File(
          ['event_name,event_parameters,item_parameters\nsign_up,method,\n'],
          'plan.csv'
        )
      );

      expect(editorFacade.inputJsonContent).toEqual([
        { event: 'sign_up', method: '$method' }
      ]);
      expect(dialog.closeAll).toHaveBeenCalled();
    });

    it('imports a legacy CSV with "dataLayer Specs" column into the input JSON editor', async () => {
      const csv =
        'dataLayer Specs\r\n' +
        "\"window.dataLayer.push({ event: 'view_item', ecommerce: { items: [{ item_name: 'Shirt' }] } });\"\r\n";

      await select(new File([csv], 'legacy.csv'));

      expect(editorFacade.inputJsonContent).toEqual([
        {
          event: 'view_item',
          ecommerce: { items: [{ item_name: 'Shirt' }] }
        }
      ]);
      expect(dialog.closeAll).toHaveBeenCalled();
    });

    it('opens error dialog with spreadsheet row numbers when legacy CSV has issues and imports nothing', async () => {
      const csv =
        'dataLayer Specs\r\n' +
        '"window.dataLayer.push({ event: \'valid_event\' });"\r\n' +
        '"window.dataLayer.push({ event: broken payload %%% });"\r\n';

      await select(new File([csv], 'broken-legacy.csv'));

      expect(editorFacade.inputJsonContent).toBeNull();
      expect(dialog.open).toHaveBeenCalledWith(
        ErrorDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            message: expect.stringContaining('Row 3:')
          })
        })
      );
    });

    it('stops legacy fallback when a file with both headers has an invalid measurement plan', async () => {
      const csv =
        'event_name,event_parameters,item_parameters,dataLayer Specs\r\n' +
        '1invalid_event_name,method,,"window.dataLayer.push({ event: \'valid_legacy\' });"\r\n';

      await select(new File([csv], 'ambiguous.csv'));

      expect(editorFacade.inputJsonContent).toBeNull();
      expect(dialog.closeAll).not.toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message: expect.stringContaining('1invalid_event_name')
        }
      });
    });

    it('rejects a CSV file that is neither a measurement plan nor a legacy sheet, naming both formats', async () => {
      await select(new File(['name,value\na,1\n'], 'other.csv'));

      expect(editorFacade.inputJsonContent).toBeNull();
      expect(dialog.open).toHaveBeenCalledWith(
        ErrorDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            message: expect.stringMatching(/measurement plan.*dataLayer Specs/s)
          })
        })
      );
    });

    it('rejects an .xlsx file with instructions to save as CSV (UTF-8)', async () => {
      const file = new File(['xlsx bytes'], 'specs.xlsx');

      await select(file);

      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message:
            'Save the spreadsheet as CSV (UTF-8) and upload the .csv file.'
        }
      });
    });

    it('rejects an .xls file with instructions to save as CSV (UTF-8)', async () => {
      const file = new File(['xls bytes'], 'specs.xls');

      await select(file);

      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message:
            'Save the spreadsheet as CSV (UTF-8) and upload the .csv file.'
        }
      });
    });

    it('rejects a "dataLayer Specs" column without any event push', async () => {
      await select(
        new File(
          ['dataLayer Specs\n"dataLayer.push({ ecommerce: null });"\n'],
          'specs.csv'
        )
      );

      expect(editorFacade.inputJsonContent).toBeNull();
      expect(dialog.open).toHaveBeenCalledWith(
        ErrorDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            message: expect.stringContaining(
              'no dataLayer.push call with an event'
            )
          })
        })
      );
    });

    it('imports a JSON file into the input JSON editor', async () => {
      const jsonContent = JSON.stringify([{ event: 'page_view' }]);
      const file = new File([jsonContent], 'specs.json', {
        type: 'application/json'
      });

      await select(file);
      // The file is read asynchronously and an effect writes it to the editor.
      await new Promise((resolve) => setTimeout(resolve, 0));
      TestBed.tick();

      expect(editorFacade.inputJsonContent).toEqual([{ event: 'page_view' }]);
      expect(dialog.closeAll).toHaveBeenCalled();
    });

    it('shows error dialog when reading JSON file content fails', async () => {
      const file = new File([''], 'broken.json', { type: 'application/json' });
      vi.spyOn(file, 'text').mockRejectedValueOnce(
        new Error('Disk read failure')
      );
      const errSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      await select(file);

      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message: 'Error reading file. Please try again.'
        }
      });
      errSpy.mockRestore();
    });

    it('shows error dialog when JSON file content cannot be parsed', async () => {
      const file = new File(['{ invalid json :::'], 'broken.json', {
        type: 'application/json'
      });
      const errSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      await select(file);

      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: {
          message: 'Error parsing JSON file. Please try again.'
        }
      });
      errSpy.mockRestore();
    });
  });
});

describe('FileUploadDialogComponent with the shared editors', () => {
  let editor: EditorService;

  afterEach(() => {
    editor.editor$.inputJson().destroy();
    editor.editor$.outputJson().destroy();
  });

  it.each([
    [
      'plan.csv',
      'event_name,event_parameters,item_parameters\nsign_up,method,\n'
    ],
    [
      'legacy.csv',
      'dataLayer Specs\n"dataLayer.push({ event: \'login\' });"\n'
    ],
    ['specs.json', '[{"event":"page_view"}]']
  ])('clears the old output after uploading %s', async (name, content) => {
    await TestBed.configureTestingModule({
      imports: [FileUploadDialogComponent],
      providers: [
        { provide: MatDialog, useValue: { open: vi.fn(), closeAll: vi.fn() } }
      ]
    }).compileComponents();
    editor = TestBed.inject(EditorService);
    editor.initEditorView(
      EditorTypeEnum.OUTPUT_JSON,
      new ElementRef(document.createElement('div'))
    );
    TestBed.inject(EditorFacadeService).outputJsonContent = {
      exportTime: 'previous conversion'
    };
    const fixture = TestBed.createComponent(FileUploadDialogComponent);
    fixture.detectChanges();

    await fixture.componentInstance.onFileSelected({
      target: { files: [new File([content], name)] }
    } as unknown as Event);
    await Promise.resolve();
    TestBed.tick();

    expect(editor.contents$.outputJson()).toBe('');
    expect(editor.editor$.outputJson().state.doc.toString()).toBe('');
  });
});
