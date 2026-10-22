import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadDialogComponent } from './file-upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorFacadeService, EventBusService } from '@data-access';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

describe('FileUploadDialogComponent', () => {
  let fixture: ComponentFixture<FileUploadDialogComponent>;
  let component: FileUploadDialogComponent;
  let dialog: {
    open: ReturnType<typeof vi.fn>;
    closeAll: ReturnType<typeof vi.fn>;
  };
  let eventBus: { emit: ReturnType<typeof vi.fn> };
  let editorFacade: { inputJsonContent: unknown };

  beforeEach(async () => {
    dialog = { open: vi.fn(), closeAll: vi.fn() };
    eventBus = { emit: vi.fn() };
    editorFacade = { inputJsonContent: null };

    await TestBed.configureTestingModule({
      imports: [FileUploadDialogComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: EventBusService, useValue: eventBus },
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

  describe('choosing a file', () => {
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

    it('rejects a CSV file that is not a measurement plan', async () => {
      await select(new File(['name,value\na,1\n'], 'other.csv'));

      expect(editorFacade.inputJsonContent).toBeNull();
      expect(dialog.open).toHaveBeenCalledWith(
        ErrorDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            message: expect.stringContaining('measurement plan')
          })
        })
      );
    });

    it('hands an .xlsx file to the spreadsheet drawer as before', async () => {
      const file = new File(['xlsx bytes'], 'specs.xlsx');

      await select(file);

      expect(eventBus.emit).toHaveBeenCalledWith('toggleDrawer', file);
    });
  });
});
