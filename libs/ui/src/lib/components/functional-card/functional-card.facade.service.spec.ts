import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { EditorFacadeService, EditorService } from '@data-access';
import { EditorTypeEnum } from '@utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversionSuccessDialogComponent } from '../conversion-success-dialog/conversion-success-dialog.component';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { FunctionalCardFacade } from './functional-card.facade.service';

describe('FunctionalCardFacade', () => {
  let facade: FunctionalCardFacade;
  let editor: EditorService;
  let editorFacade: EditorFacadeService;
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    open = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: { open } }]
    });
    facade = TestBed.inject(FunctionalCardFacade);
    editor = TestBed.inject(EditorService);
    editorFacade = TestBed.inject(EditorFacadeService);
    editorFacade.inputJsonContent = [{ event: 'login', method: '$method' }];
    TestBed.tick();
  });

  afterEach(() => {
    editor.editor$.inputJson().destroy();
    editor.editor$.outputJson().destroy();
  });

  it('shows a friendly error dialog when converting with empty input', () => {
    editor.setContent(EditorTypeEnum.INPUT_JSON, '');

    facade.convertCode();

    expect(open).toHaveBeenCalledWith(ErrorDialogComponent, {
      data: {
        message: 'Please provide a valid JSON input.'
      }
    });
  });

  it('keeps the TagCheck drawer at its current scroll position during conversion', () => {
    const drawer = document.createElement('div');
    drawer.className = 'mat-drawer-content';
    drawer.scrollTop = 35;
    Object.defineProperties(drawer, {
      scrollHeight: { value: 600 },
      clientHeight: { value: 500 }
    });
    const scrollTo = vi.fn();
    drawer.scrollTo = scrollTo;
    document.body.appendChild(drawer);

    try {
      facade.convertCode();

      expect(open).toHaveBeenCalledWith(
        ConversionSuccessDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({}) })
      );
      expect(scrollTo).not.toHaveBeenCalled();
      expect(drawer.scrollTop).toBe(35);
    } finally {
      drawer.remove();
    }
  });

  it('passes the current conversion and project slug to the success dialog', () => {
    editorFacade.outputJsonContent = { exportTime: 'previous conversion' };

    facade.convertCode(undefined, 'demo-shop');

    expect(open).toHaveBeenCalledWith(ConversionSuccessDialogComponent, {
      data: {
        configuration: JSON.parse(editor.contents$.outputJson()),
        projectSlug: 'demo-shop'
      }
    });
    expect(editor.contents$.outputJson()).not.toContain('previous conversion');
  });

  it('passes the project import hook through to the success dialog', () => {
    const projectImport = {
      label: 'Import into this project',
      run: () => Promise.resolve(true)
    };

    facade.convertCode(undefined, 'demo-shop', projectImport);

    expect(open).toHaveBeenCalledWith(ConversionSuccessDialogComponent, {
      data: {
        configuration: JSON.parse(editor.contents$.outputJson()),
        projectSlug: 'demo-shop',
        projectImport
      }
    });
  });
});
