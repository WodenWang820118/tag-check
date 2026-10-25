import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadDialogComponent } from './file-upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorFacadeService } from '@data-access';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

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
  });
});
