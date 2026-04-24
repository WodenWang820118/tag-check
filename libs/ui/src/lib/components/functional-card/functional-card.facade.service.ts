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
import {
  GTMContainerConfig,
  GTMConfiguration,
  StrictDataLayerEvent,
  validateGTMImportReadiness,
  type GTMImportReadiness
} from '@utils';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';

@Injectable({ providedIn: 'root' })
export class FunctionalCardFacade {
  private readonly dataLayer: Array<Record<string, unknown>>;

  private readonly _importReadiness = signal<GTMImportReadiness | null>(null);
  readonly importReadiness = computed(() => this._importReadiness());
  readonly importReadinessLabel = computed(() => {
    const readiness = this._importReadiness();

    if (!readiness) {
      return 'Waiting for conversion';
    }

    if (readiness.canImport) {
      return readiness.warnings.length > 0
        ? 'GTM import-ready with warnings'
        : 'GTM import-ready';
    }

    return 'Needs review before GTM import';
  });

  readonly isConvertDisabled$ = computed(() => {
    const inputJson = this.editorFacadeService.inputJsonContent();
    if (!inputJson.trim()) {
      return true;
    }

    try {
      const parsed = JSON.parse(inputJson);
      if (Array.isArray(parsed)) {
        return parsed.length === 0;
      }
      if (parsed && typeof parsed === 'object') {
        return Object.keys(parsed).length === 0;
      }
      return true;
    } catch (e) {
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
      globalThis as unknown as { dataLayer?: Array<Record<string, unknown>> }
    ).dataLayer;
    this.dataLayer = dl ?? [];

    effect(() => {
      this.editorFacadeService.inputJsonContent();
      this._importReadiness.set(null);
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
      let json: StrictDataLayerEvent[] = [];

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
    json: StrictDataLayerEvent[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false',
    esvContent: { name: string; parameters: { [x: string]: string }[] }[]
  ) {
    // set input content for downstream presenters
    this.editorFacadeService.inputJsonContent = json;

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
    const readiness = validateGTMImportReadiness(result);

    this.editorFacadeService.outputJsonContent = result;
    this._importReadiness.set(readiness);

    if (readiness.canImport) {
      this.openSuccessConversionDialog(result);
    } else {
      this.openDialog({
        message: [
          'Conversion finished, but the JSON needs review before GTM import.',
          ...readiness.issues
        ].join('\n')
      });
    }

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
