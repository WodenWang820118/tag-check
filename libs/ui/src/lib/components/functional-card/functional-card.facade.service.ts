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
import {
  ConversionSuccessDialogComponent,
  type ConversionSuccessDialogData,
  type ProjectContainerImport
} from '../conversion-success-dialog/conversion-success-dialog.component';
import {
  GTMContainerConfig,
  GTMConfiguration,
  StrictDataLayerEvent,
  validateGTMImportReadiness,
  type GTMImportReadiness
} from '@utils';
import { AdvancedExpansionPanelComponent } from '../advanced-expansion-panel/advanced-expansion-panel.component';

/**
 * Runs tag-build's conversion: reads the specs and options, converts them
 * into a container, checks it with {@link validateGTMImportReadiness} and
 * shows the result or the reasons it needs review.
 */
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

  /**
   * Converts the input editor's specs into a GTM container in Tag Build
   * mode. Tag Extract mode has no conversion yet, so it does nothing.
   */
  convertCode(
    accordionContainer?: () => AdvancedExpansionPanelComponent,
    projectSlug?: string,
    projectImport?: ProjectContainerImport | null
  ) {
    if (this.tagBuildModeService.mode === TagBuildMode.TagBuild) {
      this.convertTagBuild(accordionContainer, projectSlug, projectImport);
    }
  }

  private convertTagBuild(
    accordionContainer?: () => AdvancedExpansionPanelComponent,
    projectSlug?: string,
    projectImport?: ProjectContainerImport | null
  ) {
    try {
      if (accordionContainer) {
        try {
          accordionContainer().accordion().closeAll();
        } catch {
          // ignore if accordion not ready
        }
      }
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
          esvContent || [],
          projectSlug,
          projectImport
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

  private performConversion(
    json: StrictDataLayerEvent[],
    googleTagName: string,
    measurementId: string,
    isSendingEcommerceData: 'true' | 'false',
    esvContent: { name: string; parameters: { [x: string]: string }[] }[],
    projectSlug?: string,
    projectImport?: ProjectContainerImport | null
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
    this.postConversion(result, projectSlug, projectImport);
  }

  private postConversion(
    result: GTMConfiguration,
    projectSlug?: string,
    projectImport?: ProjectContainerImport | null
  ) {
    const readiness = validateGTMImportReadiness(result);

    this.editorFacadeService.outputJsonContent = result;
    this._importReadiness.set(readiness);

    if (readiness.canImport) {
      this.openSuccessConversionDialog(result, projectSlug, projectImport);
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

  openSuccessConversionDialog(
    configuration: GTMConfiguration,
    projectSlug?: string,
    projectImport?: ProjectContainerImport | null
  ): void {
    const data: ConversionSuccessDialogData = { configuration, projectSlug };
    // Omit the hook when the host has none, so the dialog shows only
    // download and copy. The standalone site never sets it.
    if (projectImport) {
      data.projectImport = projectImport;
    }
    this.dialog.open(ConversionSuccessDialogComponent, { data });
  }
}
