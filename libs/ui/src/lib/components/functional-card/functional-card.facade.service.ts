import { Injectable, computed, effect, signal } from '@angular/core';
import {
  TransformService,
  EditorFacadeService,
  EsvEditorService,
  SpecExtractService,
  SetupConstructorService,
  UtilsService,
  TagBuildModeService,
  TagBuildMode
} from '@data-access';
import { containerName, gtmId, tagManagerUrl } from './test-data';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConversionSuccessDialogComponent } from '../conversion-success-dialog/conversion-success-dialog.component';
import { GTMContainerConfig, GTMConfiguration, Spec } from '@utils';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';

@Injectable({ providedIn: 'root' })
export class FunctionalCardFacade {
  private readonly dataLayer: Array<Record<string, unknown>>;

  private readonly _isConvertDisabled = signal<boolean>(true);
  readonly isConvertDisabled$ = computed(() => {
    const inputJson = this.editorFacadeService.inputJsonContent();
    // disable when empty
    if (!inputJson && this._isConvertDisabled()) return true;

    // try to parse valid JSON; if invalid, disable
    try {
      const parsed = JSON.parse(inputJson);
      if (Array.isArray(parsed)) {
        return parsed.length === 0;
      }
      if (parsed && typeof parsed === 'object') {
        return Object.keys(parsed).length === 0;
      }
      // for primitives (string/number/etc), consider non-empty as enabled
      return false;
    } catch (e) {
      // invalid JSON -> disable
      console.warn('isConvertDisabled: invalid JSON', e);
      return true;
    }
  });

  constructor(
    private readonly transformService: TransformService,
    private readonly editorFacadeService: EditorFacadeService,
    private readonly esvEditorService: EsvEditorService,
    private readonly specExtractService: SpecExtractService,
    private readonly setupConstructorService: SetupConstructorService,
    private readonly utilsService: UtilsService,
    private readonly tagBuildModeService: TagBuildModeService,
    private readonly dialog: MatDialog
  ) {
    const dl = (
      window as unknown as { dataLayer?: Array<Record<string, unknown>> }
    ).dataLayer;
    this.dataLayer = dl ?? [];

    // keep in sync as the old component did; this gives an early enable when there is input array content
    effect(() => {
      const inputContent = this.editorFacadeService.inputJsonContent();
      try {
        const inputContentObj = JSON.parse(inputContent);
        if (
          inputContentObj &&
          Array.isArray(inputContentObj) &&
          inputContentObj.length > 0
        ) {
          this._isConvertDisabled.set(false);
        }
      } catch {
        // Invalid JSON, do nothing
      }
    });
  }

  get mode() {
    return this.tagBuildModeService.mode;
  }

  convertCode(accordionContainer?: () => AdvancedExpansionPanelComponent) {
    const mode = this.tagBuildModeService.mode;
    console.log('Converting code in mode:', TagBuildMode[mode]);
    if (mode === TagBuildMode.TagExtract) {
      // this.convertTagExtract();
    } else {
      this.convertTagBuild(accordionContainer);
    }
  }

  // private convertTagExtract() {
  //   console.log('Converting code in mode: TagExtract');
  //   const inputJsonEditor = this.editorFacadeService.editorView;
  //   const inputText = inputJsonEditor.inputJson().state.doc.toString();
  //   try {
  //     if (inputText === '') {
  //       this.openDialog({ message: 'Please provide a valid JSON input.' });
  //       return;
  //     }

  //     const specs = this.gtmJsonParserService.parse(inputText);
  //     this.editorFacadeService.outputJsonContent = specs;
  //     //  this.editorFacadeService.
  //   } catch (error) {
  //     const data = {
  //       message:
  //         String(error) || 'An error occurred while processing the input JSON.'
  //     };
  //     this.openDialog(data);
  //     console.error(error);
  //   }
  // }

  private convertTagBuild(
    accordionContainer?: () => AdvancedExpansionPanelComponent
  ) {
    try {
      if (accordionContainer) {
        try {
          accordionContainer().accordion().closeAll();
        } catch {
          // ignore if accordion not ready
        }
      }
      this.scrollToBottom();

      const inputJsonEditor = this.editorFacadeService.editorView.inputJson;
      const googleTagName = this.setupConstructorService.googleTagName$();
      const measurementId = this.setupConstructorService.measurementId$();
      const isSendingEcommerceData =
        this.setupConstructorService.isSendingEcommerceData$();
      const esvConent = this.esvEditorService.content$();
      let esvContent = null;
      let json: Spec[] = [];

      try {
        if (esvConent !== '') {
          esvContent = JSON.parse(esvConent) as {
            name: string;
            parameters: { [x: string]: string }[];
          }[];
        }
      } catch {
        console.warn('Failed to parse ESV content');
      }

      if (inputJsonEditor().state.doc.toString() === '') {
        this.openDialog({ message: 'Please provide a valid JSON input.' });
        return;
      }

      try {
        json = this.specExtractService.preprocessInput(
          inputJsonEditor().state.doc.toString()
        );
      } catch (err) {
        const data = {
          message:
            String(err) || 'An error occurred while processing the input JSON.'
        };
        this.openDialog(data);
        console.error(err);
        return;
      }

      try {
        this.performConversion(
          json,
          googleTagName,
          measurementId,
          isSendingEcommerceData === true ? 'true' : 'false',
          esvContent || []
        );
      } catch (error) {
        const data = {
          message:
            String(error) ||
            'An error occurred while processing the input JSON.'
        };
        this.openDialog(data);
        console.error(error);
      }
    } catch (error) {
      console.error('convertTagBuild unexpected error', error);
      this.openDialog({
        message: String(error) || 'An unexpected error occurred.'
      });
    }
  }

  private scrollToBottom() {
    try {
      const element = document.querySelector('.mat-drawer-content');
      if (element) {
        if (element.scrollHeight === element.clientHeight) {
          return;
        }
        element.scrollTo({
          top: element.scrollHeight - element.clientHeight,
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  private performConversion(
    json: Spec[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false',
    esvContent: { name: string; parameters: { [x: string]: string }[] }[]
  ) {
    // set input content for downstream presenters
    this.editorFacadeService.inputJsonContent = json as unknown as string;

    const { accountId, containerId } =
      this.utilsService.extractAccountAndContainerId(tagManagerUrl);

    const gtmContainerConfig: GTMContainerConfig = {
      accountId: accountId,
      containerId: containerId,
      containerName: containerName,
      gtmId: gtmId,
      specs: json
    };

    const result = this.transformService.convert({
      googleTagName,
      measurementId,
      gtmConfigGenerator: gtmContainerConfig,
      isSendingEcommerceData,
      esvContent: esvContent
    });
    this.postConversion(result);
  }

  private postConversion(result: GTMConfiguration) {
    this.editorFacadeService.outputJsonContent = result as unknown as string;
    this.openSuccessConversionDialog(result);

    this.dataLayer.push({
      event: 'btn_convert_click'
    });
  }

  openDialog(data: { message: string }): void {
    this.dialog.open(ErrorDialogComponent, {
      data: { message: data.message }
    });
  }

  openSuccessConversionDialog(configuration: GTMConfiguration): void {
    this.dialog.open(ConversionSuccessDialogComponent, {
      data: configuration
    });
  }
}
